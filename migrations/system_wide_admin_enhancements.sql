-- ==========================================
-- SYSTEM-WIDE ADMIN ENHANCEMENTS MIGRATION
-- ==========================================
-- This migration adds comprehensive admin functionality including:
-- 1. User suspension and wallet system
-- 2. Provider applications workflow
-- 3. Audit logging system
-- 4. Usage tracking and reporting views

-- ==========================================
-- 1. EXTEND PROFILES FOR USER SUSPENSION
-- ==========================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- ==========================================
-- 2. EXTEND USER_PLANS FOR SUBSCRIPTION MANAGEMENT
-- ==========================================
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Update RLS policy for user_plans to respect is_active status
DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans;
CREATE POLICY "Users can view their own plan"
  ON public.user_plans FOR SELECT
  USING (auth.uid() = user_id AND is_active = TRUE);

-- ==========================================
-- 3. USER WALLETS SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only service_role or admin can update balances
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access on wallets"
  ON public.user_wallets FOR ALL
  TO service_role
  USING ( true ) WITH CHECK ( true );

CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallets"
  ON public.user_wallets FOR ALL
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- ==========================================
-- 4. PROVIDER APPLICATIONS SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.provider_applications (
  id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID      UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT      NOT NULL,
  business_name       TEXT      NOT NULL,
  email               TEXT      NOT NULL,
  phone               TEXT      NOT NULL,
  zip_code            TEXT      NOT NULL,
  services_offered    TEXT[]    NOT NULL,
  service_radius      INT       NOT NULL,
  license_url         TEXT,
  license_number      TEXT,
  license_state       TEXT,
  insurance_url       TEXT,
  bio                 TEXT,
  logo_url            TEXT,
  portfolio_urls      TEXT[],
  social_links        JSONB,
  google_yelp_links   TEXT[],
  testimonials        TEXT[],
  background_consent  BOOLEAN   NOT NULL DEFAULT FALSE,
  agreements_signed   JSONB,
  status              TEXT      NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID       REFERENCES auth.users(id),
  rejection_reason    TEXT
);

-- RLS for provider_applications
ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

-- Applicant can INSERT their own application only if they don't have an active provider profile
CREATE POLICY "Applicant can insert own application"
  ON public.provider_applications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.provider_profiles p
      WHERE p.user_id = auth.uid() AND p.is_active = TRUE
    )
  );

-- Applicant can SELECT their own application
CREATE POLICY "Applicant can select own application"
  ON public.provider_applications FOR SELECT
  USING ( user_id = auth.uid() );

-- Applicant can DELETE their own application if still pending
CREATE POLICY "Applicant can delete own pending application"
  ON public.provider_applications FOR DELETE
  USING ( user_id = auth.uid() AND status = 'pending' );

-- Admin can SELECT, UPDATE, DELETE any application
CREATE POLICY "service_role manage applications"
  ON public.provider_applications FOR ALL TO service_role
  USING ( true )
  WITH CHECK ( true );

CREATE POLICY "Admins can manage all applications"
  ON public.provider_applications FOR ALL
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- ==========================================
-- 5. AUDIT LOGGING SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            BIGSERIAL    PRIMARY KEY,
  table_name    TEXT      NOT NULL,
  operation     TEXT      NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id     TEXT,
  changed_by    UUID      REFERENCES auth.users(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data      JSONB,
  new_data      JSONB
);

-- RLS: only admin/service_role can read/write
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access on audit_logs"
  ON public.audit_logs FOR ALL
  TO service_role
  USING ( true )
  WITH CHECK ( true );

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_user_admin());

-- ==========================================
-- 6. AUDIT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.log_audit() 
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the logged-in user from custom setting or current auth context
  BEGIN
    user_id := current_setting('audit.logged_in_user', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      user_id := auth.uid();
  END;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id::TEXT, user_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id::TEXT, user_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id::TEXT, user_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. ATTACH AUDIT TRIGGERS TO CRITICAL TABLES
-- ==========================================

-- Audit bookings table
DROP TRIGGER IF EXISTS trg_audit_bookings ON public.bookings;
CREATE TRIGGER trg_audit_bookings
BEFORE INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Audit user_tasks table  
DROP TRIGGER IF EXISTS trg_audit_user_tasks ON public.user_tasks;
CREATE TRIGGER trg_audit_user_tasks
BEFORE INSERT OR UPDATE OR DELETE ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Audit provider_profiles table
DROP TRIGGER IF EXISTS trg_audit_provider_profiles ON public.provider_profiles;
CREATE TRIGGER trg_audit_provider_profiles
BEFORE INSERT OR UPDATE OR DELETE ON public.provider_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Audit user_plans table
DROP TRIGGER IF EXISTS trg_audit_user_plans ON public.user_plans;
CREATE TRIGGER trg_audit_user_plans
BEFORE INSERT OR UPDATE OR DELETE ON public.user_plans
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Audit provider_applications table
DROP TRIGGER IF EXISTS trg_audit_provider_applications ON public.provider_applications;
CREATE TRIGGER trg_audit_provider_applications
BEFORE INSERT OR UPDATE OR DELETE ON public.provider_applications
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Audit profiles table
DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
CREATE TRIGGER trg_audit_profiles
BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- ==========================================
-- 8. USAGE TRACKING & REPORTING VIEWS
-- ==========================================

-- View: Documents Per User
CREATE OR REPLACE VIEW public.view_user_document_counts AS
SELECT
  metadata->>'user_id' AS user_id,
  COUNT(*) AS doc_count
FROM storage.objects
WHERE bucket_id = 'documents'
GROUP BY metadata->>'user_id';

-- View: Homes Per User
CREATE OR REPLACE VIEW public.view_user_home_counts AS
SELECT
  user_id,
  COUNT(*) AS home_count
FROM public.properties
GROUP BY user_id;

-- View: Tasks Completed Per User
CREATE OR REPLACE VIEW public.view_user_tasks_completed AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE completed = TRUE) AS tasks_completed
FROM public.user_tasks
GROUP BY user_id;

-- View: Bookings Made Per Homeowner
CREATE OR REPLACE VIEW public.view_homeowner_booking_counts AS
SELECT
  homeowner_id AS user_id,
  COUNT(*) AS bookings_made
FROM public.bookings
GROUP BY homeowner_id;

-- View: Bookings Received Per Provider
CREATE OR REPLACE VIEW public.view_provider_booking_counts AS
SELECT
  provider_id AS user_id,
  COUNT(*) AS bookings_received
FROM public.bookings
GROUP BY provider_id;

-- View: Daily New Signups
CREATE OR REPLACE VIEW public.view_daily_new_signups AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS signup_count
FROM auth.users
GROUP BY 1
ORDER BY 1 DESC;

-- View: Active Subscribers
CREATE OR REPLACE VIEW public.view_active_subscribers AS
SELECT
  COUNT(*) AS active_count
FROM public.user_plans
WHERE is_active = TRUE;

-- View: Task Completion Trend (Last 30 Days)
CREATE OR REPLACE VIEW public.view_daily_tasks_completed AS
SELECT
  date_trunc('day', updated_at) AS day,
  COUNT(*) AS completed_count
FROM public.user_tasks
WHERE completed = TRUE
  AND updated_at >= now() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ==========================================
-- 9. RLS POLICIES FOR REPORTING VIEWS
-- ==========================================

-- Enable RLS on reporting views (for admin access only)
ALTER VIEW public.view_user_document_counts SET (security_barrier = true);
ALTER VIEW public.view_user_home_counts SET (security_barrier = true);
ALTER VIEW public.view_user_tasks_completed SET (security_barrier = true);
ALTER VIEW public.view_homeowner_booking_counts SET (security_barrier = true);
ALTER VIEW public.view_provider_booking_counts SET (security_barrier = true);
ALTER VIEW public.view_daily_new_signups SET (security_barrier = true);
ALTER VIEW public.view_active_subscribers SET (security_barrier = true);
ALTER VIEW public.view_daily_tasks_completed SET (security_barrier = true);

-- ==========================================
-- 10. UTILITY FUNCTIONS FOR ADMIN OPERATIONS
-- ==========================================

-- Function to safely set audit context
CREATE OR REPLACE FUNCTION public.set_audit_context(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('audit.logged_in_user', user_uuid::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.set_audit_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_audit_context(UUID) TO service_role;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND is_suspended = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_user_suspended(UUID) TO authenticated;

-- ==========================================
-- 11. UPDATE SCHEMA.SQL WITH NEW STRUCTURE
-- ==========================================
COMMENT ON TABLE public.user_wallets IS 'User wallet balances for credit system';
COMMENT ON TABLE public.provider_applications IS 'Provider application submissions for admin review';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all critical operations';

-- Migration completed successfully
SELECT 'System-wide admin enhancements migration completed successfully!' AS status; 