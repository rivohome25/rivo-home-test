-- User profiles table
CREATE TABLE profiles (
  id           UUID    REFERENCES auth.users NOT NULL PRIMARY KEY,
  role         TEXT    CHECK (role IN ('homeowner','provider','admin')) NOT NULL,
  tier         INTEGER DEFAULT 0,
  full_name    TEXT    DEFAULT '',
  is_admin     BOOLEAN DEFAULT FALSE,
  opt_in_7day_reminders BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  free_plan_id INTEGER;
BEGIN
  -- Get user role, default to homeowner
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner');
  
  -- Insert profile with proper error handling
  INSERT INTO public.profiles (id, role, full_name, is_admin)
    VALUES (
      NEW.id, 
      user_role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      CASE WHEN user_role = 'admin' THEN TRUE ELSE FALSE END
    )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();
  
  -- Auto-assign Free plan to new homeowners
  IF user_role = 'homeowner' THEN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
    
    IF free_plan_id IS NOT NULL THEN
      INSERT INTO public.user_plans (user_id, plan_id)
        VALUES (NEW.id, free_plan_id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Create a security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass RLS by using a security definer function
  -- This function runs with elevated privileges and doesn't trigger RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Let admins see every profile (using safe function)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR public.is_user_admin()
  );

-- Optional: admins can update any profile (using safe function)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR public.is_user_admin()
  );

-- Allow service role to bypass all policies (for system operations)
CREATE POLICY "Service role bypass"
  ON public.profiles FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Check if auth_admin role exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'auth_admin') THEN
    CREATE ROLE auth_admin;
  END IF;
END
$$;

-- Grant trigger permission to auth_admin role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO auth_admin;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO auth_admin;

-- ==========================================
-- PLANS AND USER PLANS TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.plans (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL UNIQUE,
  price               NUMERIC NOT NULL,
  max_homes           INTEGER, -- NULL means unlimited (Premium)
  max_docs            INTEGER, -- NULL means unlimited (Premium)
  unlimited_reminders BOOLEAN NOT NULL DEFAULT FALSE,
  report_access       BOOLEAN NOT NULL DEFAULT FALSE,
  priority_support    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insert default plans
INSERT INTO public.plans (name, price, max_homes, max_docs, unlimited_reminders, report_access, priority_support) VALUES
  ('Free', 0.00, 1, 3, false, false, false),
  ('Core', 7.00, 3, 50, true, true, false),
  ('Premium', 20.00, NULL, NULL, true, true, true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_plans (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                INTEGER REFERENCES public.plans(id),
  started_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT DEFAULT 'free',
  current_period_end     TIMESTAMPTZ
);

-- Add foreign key reference to profiles table as well
ALTER TABLE public.user_plans 
ADD CONSTRAINT fk_user_plans_profiles
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Ensure proper signup date tracking
ALTER TABLE public.profiles 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT now();

-- Enable RLS on user_plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Users can view their own plan
CREATE POLICY "Users can view their own plan"
  ON public.user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own plan
CREATE POLICY "Users can insert their own plan"
  ON public.user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan
CREATE POLICY "Users can update their own plan"
  ON public.user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PLAN ENFORCEMENT HELPER FUNCTIONS
-- ==========================================

-- Helper function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS TABLE(
  plan_name TEXT,
  max_homes INTEGER,
  price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.name, p.max_homes, p.price
  FROM public.user_plans up
  JOIN public.plans p ON up.plan_id = p.id
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated;

-- Helper function to check if user can perform action
CREATE OR REPLACE FUNCTION public.can_user_perform_action(
  user_uuid UUID,
  action_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_plan RECORD;
  current_count INTEGER;
BEGIN
  -- Get user's plan
  SELECT p.name, p.max_homes INTO user_plan
  FROM public.user_plans up
  JOIN public.plans p ON up.plan_id = p.id
  WHERE up.user_id = user_uuid;
  
  -- If no plan found, default to Free
  IF user_plan IS NULL THEN
    user_plan.name := 'Free';
    user_plan.max_homes := 1;
  END IF;
  
  CASE action_type
    WHEN 'add_property' THEN
      IF user_plan.max_homes IS NULL THEN
        RETURN true; -- Premium unlimited
      ELSE
        SELECT COUNT(*) INTO current_count
        FROM public.properties
        WHERE user_id = user_uuid;
        RETURN current_count < user_plan.max_homes;
      END IF;
      
    WHEN 'upload_document' THEN
      SELECT COUNT(*) INTO current_count
      FROM storage.objects
      WHERE bucket_id = 'documents' 
      AND (storage.foldername(name))[1] = user_uuid::text;
      
      IF user_plan.max_homes IS NULL THEN
        RETURN true; -- Premium unlimited
      ELSIF user_plan.max_homes = 1 THEN
        RETURN current_count < 3; -- Free: 3 documents
      ELSIF user_plan.max_homes = 3 THEN
        RETURN current_count < 50; -- Core: 50 documents
      ELSE
        RETURN true;
      END IF;
      
    WHEN 'create_booking' THEN
      -- Only Premium users can create direct bookings
      RETURN user_plan.max_homes IS NULL;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_user_perform_action(UUID, TEXT) TO authenticated;

-- ==========================================
-- PROPERTIES TABLE WITH PLAN ENFORCEMENT
-- ==========================================
CREATE TABLE IF NOT EXISTS public.properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address       TEXT NOT NULL,
  year_built    INTEGER,
  property_type TEXT,
  region        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties SELECT policy (unchanged)
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Properties INSERT policy with plan limit enforcement
CREATE POLICY "properties_insert_with_plan_limit" ON public.properties
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id AND
    (
      -- Get user's current plan max_homes limit
      SELECT 
        CASE 
          WHEN p.max_homes IS NULL THEN true  -- Premium (unlimited)
          ELSE (
            SELECT COUNT(*) 
            FROM public.properties 
            WHERE user_id = auth.uid()
          ) < p.max_homes
        END
      FROM public.user_plans up
      JOIN public.plans p ON up.plan_id = p.id
      WHERE up.user_id = auth.uid()
    )
  );

-- Properties UPDATE policy (unchanged)
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Properties DELETE policy (unchanged)
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE TO public
  USING (auth.uid() = user_id);

-- ==========================================
-- STORAGE OBJECTS WITH DOCUMENT LIMITS
-- ==========================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage SELECT policy (view own documents)
CREATE POLICY "storage_select_own_documents" ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage INSERT policy with document limit enforcement
CREATE POLICY "storage_insert_with_document_limit" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
      -- Get user's document limit based on plan
      SELECT 
        CASE 
          WHEN p.max_homes IS NULL THEN true  -- Premium (unlimited documents)
          WHEN p.max_homes = 1 THEN (
            -- Free plan: 3 documents max
            SELECT COUNT(*) 
            FROM storage.objects 
            WHERE bucket_id = 'documents' 
            AND (storage.foldername(name))[1] = auth.uid()::text
          ) < 3
          WHEN p.max_homes = 3 THEN (
            -- Core plan: 50 documents max
            SELECT COUNT(*) 
            FROM storage.objects 
            WHERE bucket_id = 'documents' 
            AND (storage.foldername(name))[1] = auth.uid()::text
          ) < 50
          ELSE true
        END
      FROM public.user_plans up
      JOIN public.plans p ON up.plan_id = p.id
      WHERE up.user_id = auth.uid()
    )
  );

-- Storage DELETE policy (delete own documents)
CREATE POLICY "storage_delete_own_documents" ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==========================================
-- PROVIDER BOOKINGS WITH PREMIUM RESTRICTION
-- ==========================================
CREATE TABLE IF NOT EXISTS public.provider_bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homeowner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_ts         TIMESTAMPTZ NOT NULL,
  end_ts           TIMESTAMPTZ NOT NULL,
  service_type     TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  homeowner_notes  TEXT,
  provider_notes   TEXT,
  image_urls       TEXT[] DEFAULT '{}',
  image_count      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on provider_bookings
ALTER TABLE public.provider_bookings ENABLE ROW LEVEL SECURITY;

-- Provider bookings SELECT policy (unchanged)
CREATE POLICY "provider_bookings_select_own" ON public.provider_bookings
  FOR SELECT TO public
  USING (
    auth.uid() = provider_id OR 
    auth.uid() = homeowner_id
  );

-- Provider bookings UPDATE policy (unchanged)
CREATE POLICY "provider_bookings_update_provider" ON public.provider_bookings
  FOR UPDATE TO public
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Provider bookings INSERT policy - Premium only restriction
CREATE POLICY "provider_bookings_insert_premium_only" ON public.provider_bookings
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = homeowner_id AND
    (
      -- Only Premium users (max_homes IS NULL) can create direct bookings
      SELECT p.max_homes IS NULL
      FROM public.user_plans up
      JOIN public.plans p ON up.plan_id = p.id
      WHERE up.user_id = auth.uid()
    )
  );

-- Provider bookings DELETE policy (homeowners can cancel their own)
CREATE POLICY "provider_bookings_delete_homeowner" ON public.provider_bookings
  FOR DELETE TO public
  USING (auth.uid() = homeowner_id);

-- ==========================================
-- SERVICE TYPES TABLE (Phase 4)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.service_types (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Insert common service types
INSERT INTO public.service_types (name) VALUES
  ('plumbing'),
  ('hvac'),
  ('electrical'),
  ('roofing'),
  ('landscaping'),
  ('painting'),
  ('flooring'),
  ('appliance-repair'),
  ('handyman'),
  ('cleaning')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on service types
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access to service types
CREATE POLICY "Public can view service types"
  ON public.service_types FOR SELECT
  USING ( true );

-- ==========================================
-- PROVIDER SERVICES MASTER TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.provider_services_master (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Insert service types for provider search
INSERT INTO public.provider_services_master (name) VALUES
  ('Appliance Repair'),
  ('Carpentry'),
  ('Cleaning'),
  ('Deck Building'),
  ('Electrical'),
  ('Fence Installation'),
  ('Flooring'),
  ('Garage Door Repair'),
  ('Gutter Cleaning'),
  ('Handyman'),
  ('Home Inspection'),
  ('Home Security'),
  ('HVAC'),
  ('Landscaping'),
  ('Other'),
  ('Painting'),
  ('Pest Control'),
  ('Plumbing'),
  ('Pool Maintenance'),
  ('Roofing'),
  ('Window Installation')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on provider services master
ALTER TABLE public.provider_services_master ENABLE ROW LEVEL SECURITY;

-- Allow public read access to provider services master
CREATE POLICY "Public can view provider services master"
  ON public.provider_services_master FOR SELECT
  USING ( true );

-- ==========================================
-- BOOKINGS TABLE (Phase 4)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type_id  INT         NOT NULL REFERENCES public.service_types(id),
  scheduled_date   DATE        NOT NULL,
  scheduled_time   TIME        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',  -- pending|scheduled|completed|cancelled
  notes            TEXT,       -- Optional booking notes
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add updated_at trigger for bookings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Homeowners can manage their own bookings
CREATE POLICY "Homeowner can manage own bookings"
  ON public.bookings FOR ALL
  USING ( homeowner_id = auth.uid() )
  WITH CHECK ( homeowner_id = auth.uid() );

-- Providers can see & update their own bookings
CREATE POLICY "Provider can see own bookings"
  ON public.bookings FOR SELECT
  USING ( provider_id = auth.uid() );

CREATE POLICY "Provider can update own bookings"
  ON public.bookings FOR UPDATE
  USING ( provider_id = auth.uid() )
  WITH CHECK ( provider_id = auth.uid() );

-- ==========================================
-- ENHANCED NOTIFICATIONS TABLE (Phase 4)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  link        TEXT,       -- optional URL to click
  type        TEXT        NOT NULL DEFAULT 'info', -- info|success|warning|error
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own notifications"
  ON public.notifications FOR SELECT
  USING ( user_id = auth.uid() );

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

-- ==========================================
-- NOTIFICATION TRIGGERS (Phase 4)
-- ==========================================

-- Function to notify provider on new booking
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  homeowner_name TEXT;
  service_name TEXT;
BEGIN
  -- Get homeowner name
  SELECT COALESCE(prof.full_name, u.email) INTO homeowner_name
  FROM auth.users u
  LEFT JOIN public.profiles prof ON u.id = prof.id
  WHERE u.id = NEW.homeowner_id;
  
  -- Get service type name
  SELECT name INTO service_name
  FROM public.service_types
  WHERE id = NEW.service_type_id;
  
  -- Insert notification for provider
  INSERT INTO public.notifications(user_id, title, message, link, type)
  VALUES (
    NEW.provider_id,
    'New Booking Request',
    format('New %s booking request from %s for %s at %s', 
           service_name, 
           homeowner_name, 
           NEW.scheduled_date, 
           NEW.scheduled_time),
    '/dashboard/bookings/' || NEW.id,
    'info'
  );
  
  RETURN NEW;
END;
$$ language plpgsql;

-- Function to notify homeowner on booking status change
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  service_name TEXT;
  status_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider business name
  SELECT COALESCE(business_name, full_name) INTO provider_name
  FROM public.provider_profiles
  WHERE user_id = NEW.provider_id;
  
  -- Get service type name
  SELECT name INTO service_name
  FROM public.service_types
  WHERE id = NEW.service_type_id;
  
  -- Set message and type based on new status
  CASE NEW.status
    WHEN 'scheduled' THEN
      status_message := format('Your %s booking with %s has been confirmed for %s at %s', 
                              service_name, provider_name, NEW.scheduled_date, NEW.scheduled_time);
      notification_type := 'success';
    WHEN 'completed' THEN
      status_message := format('Your %s service with %s has been completed', 
                              service_name, provider_name);
      notification_type := 'success';
    WHEN 'cancelled' THEN
      status_message := format('Your %s booking with %s has been cancelled', 
                              service_name, provider_name);
      notification_type := 'warning';
    ELSE
      status_message := format('Your %s booking status has been updated to: %s', 
                              service_name, NEW.status);
      notification_type := 'info';
  END CASE;
  
  -- Insert notification for homeowner
  INSERT INTO public.notifications(user_id, title, message, link, type)
  VALUES (
    NEW.homeowner_id,
    'Booking Status Update',
    status_message,
    '/dashboard/bookings/' || NEW.id,
    notification_type
  );
  
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers
CREATE TRIGGER trig_notify_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();

CREATE TRIGGER trig_notify_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();

-- ==========================================
-- DASHBOARD VIEWS (Phase 4)
-- ==========================================

-- Homeowner's upcoming bookings (next 5)
CREATE OR REPLACE VIEW public.view_upcoming_bookings AS
SELECT
  b.id,
  b.provider_id,
  b.scheduled_date,
  b.scheduled_time,
  b.status,
  b.notes,
  pp.business_name as provider_business_name,
  pp.full_name as provider_name,
  st.name as service_type,
  b.created_at
FROM public.bookings b
LEFT JOIN public.provider_profiles pp ON b.provider_id = pp.user_id
LEFT JOIN public.service_types st ON b.service_type_id = st.id
WHERE b.homeowner_id = auth.uid()
  AND b.scheduled_date >= current_date
ORDER BY b.scheduled_date, b.scheduled_time
LIMIT 5;

-- Provider's new leads (pending bookings)
CREATE OR REPLACE VIEW public.view_provider_new_leads AS
SELECT
  b.id,
  b.homeowner_id,
  b.service_type_id,
  b.scheduled_date,
  b.scheduled_time,
  b.notes,
  p.email as homeowner_email,
  prof.full_name as homeowner_name,
  st.name as service_type,
  b.created_at
FROM public.bookings b
LEFT JOIN auth.users p ON b.homeowner_id = p.id
LEFT JOIN public.profiles prof ON b.homeowner_id = prof.id
LEFT JOIN public.service_types st ON b.service_type_id = st.id
WHERE b.provider_id = auth.uid()
  AND b.status = 'pending'
ORDER BY b.created_at DESC;

-- Unread notifications view
CREATE OR REPLACE VIEW public.view_unread_notifications AS
SELECT 
  id, 
  title,
  message, 
  link, 
  type,
  created_at
FROM public.notifications
WHERE user_id = auth.uid() AND NOT is_read
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- TASKS TABLE
-- ==========================================
CREATE TABLE tasks (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID     REFERENCES profiles(id) NOT NULL,
  title       TEXT     NOT NULL,
  description TEXT,
  status      TEXT     CHECK(status IN ('pending','in_progress','completed')) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Users can view their tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- Admin override for tasks
CREATE POLICY "Admins can manage all tasks"
  ON tasks FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Trigger for tasks updated_at
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================
-- DOCUMENTS TABLE
-- ==========================================
CREATE TABLE documents (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID     REFERENCES profiles(id) NOT NULL,
  title       TEXT     NOT NULL,
  description TEXT,
  file_path   TEXT     NOT NULL,
  file_type   TEXT     NOT NULL,
  file_size   INTEGER  NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can update their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their docs" ON public.documents;

-- Create clean, non-recursive policies
CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE TO public
  USING (auth.uid() = user_id);

-- ==========================================
-- BOOKINGS TABLE
-- ==========================================
CREATE TABLE bookings (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id   UUID     REFERENCES profiles(id) NOT NULL,
  provider_id    UUID     REFERENCES profiles(id),
  service_type   TEXT     NOT NULL,
  description    TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status         TEXT     CHECK(status IN ('requested','confirmed','completed','cancelled')) NOT NULL DEFAULT 'requested',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Homeowners can view their bookings"
  ON bookings FOR SELECT
  USING (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can insert their bookings"
  ON bookings FOR INSERT
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can update their bookings"
  ON bookings FOR UPDATE
  USING (homeowner_id = auth.uid())
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can delete their bookings"
  ON bookings FOR DELETE
  USING (homeowner_id = auth.uid());

CREATE POLICY "Providers can view their assigned bookings"
  ON bookings FOR SELECT
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Providers can update their assigned bookings"
  ON bookings FOR UPDATE
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  )
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================
-- JOBS TABLE
-- ==========================================
CREATE TABLE jobs (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID     REFERENCES profiles(id) NOT NULL,
  booking_id   UUID     REFERENCES bookings(id),
  title        TEXT     NOT NULL,
  description  TEXT,
  status       TEXT     CHECK(status IN ('pending','in_progress','completed','cancelled')) NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs
CREATE POLICY "Providers can view their jobs"
  ON jobs FOR SELECT
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Providers can insert their jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Providers can update their jobs"
  ON jobs FOR UPDATE
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  )
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Providers can delete their jobs"
  ON jobs FOR DELETE
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Admins can manage all jobs"
  ON jobs FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================
-- EARNINGS TABLE
-- ==========================================
CREATE TABLE earnings (
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID     REFERENCES profiles(id) NOT NULL,
  job_id          UUID     REFERENCES jobs(id),
  amount          DECIMAL(10,2) NOT NULL,
  status          TEXT     CHECK(status IN ('pending','paid')) NOT NULL DEFAULT 'pending',
  transaction_date TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for earnings
CREATE POLICY "Providers can view their earnings"
  ON earnings FOR SELECT
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Admins can manage all earnings"
  ON earnings FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TRIGGER earnings_updated_at
  BEFORE UPDATE ON public.earnings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================
-- REVIEWS TABLE
-- ==========================================
CREATE TABLE reviews (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID     REFERENCES profiles(id) NOT NULL,
  provider_id  UUID     REFERENCES profiles(id) NOT NULL,
  booking_id   UUID     REFERENCES bookings(id),
  rating       INTEGER  CHECK(rating >= 1 AND rating <= 5) NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Homeowners can view their reviews"
  ON reviews FOR SELECT
  USING (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can insert their reviews"
  ON reviews FOR INSERT
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can update their reviews"
  ON reviews FOR UPDATE
  USING (homeowner_id = auth.uid())
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Homeowners can delete their reviews"
  ON reviews FOR DELETE
  USING (homeowner_id = auth.uid());

CREATE POLICY "Providers can view their reviews"
  ON reviews FOR SELECT
  USING (
    provider_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'provider'
  );

CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert with values from user metadata
  INSERT INTO public.profiles (id, role, tier, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    COALESCE((NEW.raw_user_meta_data->>'tier')::integer, 0),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 

  -- 1) Remove the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2) Remove the helper function
DROP FUNCTION IF EXISTS public.handle_new_user();

SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth';

  -- 1) Remove the correct trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- 2) Remove the helper function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove any problematic policies on profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', r.policyname);
  END LOOP;
END;
$$;

-- Turn on RLS
ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

-- 1) Allow users to SELECT only their own row
CREATE POLICY select_own_profile
  ON public.profiles
  FOR SELECT
  USING ( id = auth.uid() );

-- 2) Allow users to INSERT only a row with their own id
CREATE POLICY insert_own_profile
  ON public.profiles
  FOR INSERT
  WITH CHECK ( id = auth.uid() );

-- 3) Allow users to UPDATE only their own row
CREATE POLICY update_own_profile
  ON public.profiles
  FOR UPDATE
  USING ( id = auth.uid() )
  WITH CHECK ( id = auth.uid() );

  -- Assuming you store your app-role in profiles.role
CREATE POLICY admin_select_all_profiles
  ON public.profiles
  FOR SELECT
  USING ( (
    -- Only allow if my own profile says I'm an admin:
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) );

  -- 1. Drop every policy on public.profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END;
$$;

SELECT * 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename   = 'profiles';

  ALTER TABLE public.profiles
  DISABLE ROW LEVEL SECURITY;

  -- 1) Drop & re-create the table
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
  id          SERIAL PRIMARY KEY,
  subject_id  UUID    REFERENCES public.profiles(id) NOT NULL,
  reviewer_id UUID    REFERENCES public.profiles(id) NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2) Enable Row-Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3) Create your RLS policies (no ellipses!)
CREATE POLICY "Providers see own reviews"
  ON public.reviews
  FOR SELECT
  USING ( auth.uid() = subject_id );

CREATE POLICY "Customers can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK ( auth.uid() = reviewer_id );

CREATE POLICY "Customers see their own reviews"
  ON public.reviews
  FOR SELECT
  USING ( auth.uid() = reviewer_id );

  -- RLS Policies for Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- clean out any old policies
DROP POLICY IF EXISTS "Users can view their tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their tasks" ON public.tasks;

-- homeowners can read their own tasks
CREATE POLICY "Users can view their tasks"
  ON public.tasks
  FOR SELECT
  USING ( auth.uid() = user_id );

-- homeowners can insert new tasks for themselves
CREATE POLICY "Users can insert their tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- homeowners can update only their own tasks
CREATE POLICY "Users can update their tasks"
  ON public.tasks
  FOR UPDATE
  USING ( auth.uid() = user_id );

-- homeowners can delete only their own tasks
CREATE POLICY "Users can delete their tasks"
  ON public.tasks
  FOR DELETE
  USING ( auth.uid() = user_id );



-- RLS Policies for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can update their docs" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their docs" ON public.documents;

-- Create clean, non-recursive policies
CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE TO public
  USING (auth.uid() = user_id);

  -- Tasks table to track homeowner tasks (Recent Activity and Maintenance Schedule)
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'done', 'scheduled')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Supabase Authentication Schema (managed by Supabase)
-- This is a reference to tables managed by Supabase Auth

-- Users are stored in auth.users (managed by Supabase Auth)

-- Custom Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('homeowner', 'provider')),
  tier INTEGER NOT NULL DEFAULT 0,
  full_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Jobs table to track service requests
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id),
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  job_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('new', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'new',
  priority TEXT NOT NULL CHECK (priority IN ('high', 'normal')) DEFAULT 'normal',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Documents table to store property-related documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_name TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Maintenance table to track maintenance schedules
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  last_performed_at TIMESTAMP WITH TIME ZONE,
  next_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tasks table to track todos and action items
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Notifications table to track user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  message      text        NOT NULL,
  notification_type text    NOT NULL CHECK (notification_type IN ('system','reminder','alert','info','warning')) DEFAULT 'system',
  is_read      boolean     DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at   timestamptz DEFAULT now()
);

-- Reviews table to track service provider reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  subject_id UUID REFERENCES public.profiles(id) NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);




-- RLS Policies for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read their own documents" ON public.documents;
CREATE POLICY "Users can read their own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
CREATE POLICY "Users can create their own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
  ON public.documents
  FOR DELETE
  USING (auth.uid() = user_id);



-- RLS Policies for Maintenance
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own maintenance schedules" ON public.maintenance;
CREATE POLICY "Users can read their own maintenance schedules"
  ON public.maintenance
  FOR SELECT
  USING (auth.uid() = property_user_id);

DROP POLICY IF EXISTS "Users can create their own maintenance schedules" ON public.maintenance;
CREATE POLICY "Users can create their own maintenance schedules"
  ON public.maintenance
  FOR INSERT
  WITH CHECK (auth.uid() = property_user_id);

DROP POLICY IF EXISTS "Users can update their own maintenance schedules" ON public.maintenance;
CREATE POLICY "Users can update their own maintenance schedules"
  ON public.maintenance
  FOR UPDATE
  USING (auth.uid() = property_user_id);



-- RLS Policies for Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own tasks" ON public.tasks;
CREATE POLICY "Users can read their own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
CREATE POLICY "Users can create their own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id);



-- RLS Policies for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);



-- RLS Policies for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers see own reviews" ON public.reviews;
CREATE POLICY "Providers see own reviews"
  ON public.reviews 
  FOR SELECT 
  USING (auth.uid() = subject_id);

DROP POLICY IF EXISTS "Customers can create reviews" ON public.reviews;
CREATE POLICY "Customers can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Customers can see reviews they've written" ON public.reviews;
CREATE POLICY "Customers can see reviews they've written"
  ON public.reviews
  FOR SELECT
  USING (auth.uid() = reviewer_id);



-- RLS Policies for Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can read their assigned jobs" ON public.jobs;
CREATE POLICY "Providers can read their assigned jobs" 
  ON public.jobs 
  FOR SELECT 
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Customers can read their own jobs" ON public.jobs;
CREATE POLICY "Customers can read their own jobs" 
  ON public.jobs 
  FOR SELECT 
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
CREATE POLICY "Customers can create jobs" 
  ON public.jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Providers can update their assigned jobs" ON public.jobs;
CREATE POLICY "Providers can update their assigned jobs" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() = provider_id);



-- RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);



-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, tier, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    COALESCE((NEW.raw_user_meta_data->>'tier')::integer, 0),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  

-- 1) Ensure tasks table exists
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text        NOT NULL
);

-- 2) Add any missing columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS due_date      date        NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS completed     boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();

-- 3) Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  message      text        NOT NULL,
  notification_type text    NOT NULL CHECK (notification_type IN ('system','reminder','alert','info','warning')) DEFAULT 'system',
  is_read      boolean     DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at   timestamptz DEFAULT now()
);

CREATE OR REPLACE VIEW public.view_unread_notifications AS
SELECT
  id,
  title,
  message,
  notification_type,
  created_at
FROM public.notifications
WHERE user_id   = auth.uid()    -- only this user's notifications
  AND is_read  = false          -- only unread ones
ORDER BY created_at DESC
LIMIT 3;

CREATE OR REPLACE VIEW public.view_upcoming_tasks AS
SELECT
  id,
  title,
  description,
  due_date
FROM public.tasks
WHERE user_id    = auth.uid()     -- only this user's tasks
  AND due_date  >= current_date   -- today or in the future
ORDER BY due_date
LIMIT 3;

CREATE OR REPLACE VIEW public.view_latest_reviews AS
SELECT
  id,
  rating,
  comment,
  created_at
FROM public.reviews
WHERE subject_id = auth.uid()    -- reviews about the current user
ORDER BY created_at DESC
LIMIT 2;

-- === TASKS POLICIES ===
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (user_id = auth.uid());

-- === NOTIFICATIONS POLICIES ===
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- (We typically don't DELETE notifications, so no DELETE policy here.)

-- 1) RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowner can select own reviews"
  ON public.reviews FOR SELECT
  USING ( subject_id = auth.uid() );

-- 2) Tutorials table & view
CREATE TABLE IF NOT EXISTS public.tutorials (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text          NOT NULL,
  type        text,
  url         text          NOT NULL,
  length      integer,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tutorials"
  ON public.tutorials FOR SELECT
  USING ( true );

CREATE OR REPLACE VIEW public.view_popular_tutorials AS
SELECT
  id,
  title,
  type,
  url,
  length
FROM public.tutorials
ORDER BY created_at DESC
LIMIT 5;

-- 3) Providers table & view
CREATE TABLE IF NOT EXISTS public.providers (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text         NOT NULL,
  service_type text,
  description  text,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read providers"
  ON public.providers FOR SELECT
  USING ( true );

CREATE OR REPLACE VIEW public.view_available_providers AS
SELECT
  id,
  name,
  service_type,
  description
FROM public.providers
ORDER BY name;

-- 4) Bookings table & RLS
CREATE TABLE IF NOT EXISTS public.bookings (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id   uuid         REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id    uuid         REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_date   timestamptz  NOT NULL,
  status         text         NOT NULL DEFAULT 'pending',
  created_at     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowner can create own booking"
  ON public.bookings FOR INSERT
  WITH CHECK ( homeowner_id = auth.uid() );

CREATE POLICY "Homeowner can read own bookings"
  ON public.bookings FOR SELECT
  USING      ( homeowner_id = auth.uid() );

-- (Optionally, if you want homeowners to cancel:)
CREATE POLICY "Homeowner can delete own bookings"
  ON public.bookings FOR DELETE
  USING      ( homeowner_id = auth.uid() );

  CREATE OR REPLACE VIEW public.view_upcoming_bookings AS
SELECT
  b.id,
  b.scheduled_date    AS booking_date,    -- using your real column
  p.name              AS provider_name,
  p.service_type      AS provider_type
FROM public.bookings AS b
JOIN public.providers AS p
  ON p.id = b.provider_id
WHERE b.homeowner_id   = auth.uid()       -- only this user's bookings
  AND b.scheduled_date >= now()            -- today or later
ORDER BY b.scheduled_date
LIMIT 3;

-- 1) Add full_name to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';

-- 2) (Optional) Populate existing profiles with their email as a stop-gap
UPDATE public.profiles p
SET full_name = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.full_name = '';

-- 3) Rebuild your provider views using full_name
-- 3a) Active jobs
CREATE OR REPLACE VIEW public.view_provider_active_jobs AS
SELECT
  b.id,
  b.homeowner_id,
  p.full_name        AS customer_name,
  b.service_type,
  b.scheduled_date
FROM public.bookings b
JOIN public.profiles p
  ON p.id = b.homeowner_id
WHERE b.provider_id = auth.uid()
  AND b.status = 'pending'
ORDER BY b.created_at DESC;

-- 3b) Scheduled / upcoming jobs
CREATE OR REPLACE VIEW public.view_provider_scheduled_jobs AS
SELECT
  b.id,
  b.homeowner_id,
  p.full_name        AS customer_name,
  b.service_type,
  b.scheduled_date
FROM public.bookings b
JOIN public.profiles p
  ON p.id = b.homeowner_id
WHERE b.provider_id = auth.uid()
  AND b.status = 'scheduled'
  AND b.scheduled_date >= now()
ORDER BY b.scheduled_date;

-- 3c) Recent reviews of you
CREATE OR REPLACE VIEW public.view_provider_recent_reviews AS
SELECT
  r.id,
  r.reviewer_id,
  reviewer.full_name AS reviewer_name,
  r.rating,
  r.comment,
  r.created_at
FROM public.reviews r
JOIN public.profiles reviewer
  ON reviewer.id = r.reviewer_id
WHERE r.subject_id = auth.uid()
ORDER BY r.created_at DESC
LIMIT 3;

-- 3d) Job counts
CREATE OR REPLACE VIEW public.view_provider_job_counts AS
SELECT
  (SELECT COUNT(*) FROM public.bookings WHERE provider_id = auth.uid() AND status = 'pending')   AS new_leads,
  (SELECT COUNT(*) FROM public.bookings WHERE provider_id = auth.uid() AND status = 'scheduled') AS scheduled,
  (SELECT COUNT(*) FROM public.bookings WHERE provider_id = auth.uid() AND status = 'completed') AS completed;

  ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS amount numeric(10,2) NOT NULL DEFAULT 0;

  CREATE OR REPLACE VIEW public.view_provider_all_jobs AS
SELECT
  b.id,
  p.full_name        AS customer_name,
  b.service_type,
  b.scheduled_date   AS date,
  b.status,
  b.amount,
  r.rating
FROM public.bookings b
JOIN public.profiles p
  ON p.id = b.homeowner_id
LEFT JOIN public.reviews r
  ON r.subject_id  = auth.uid()
  AND r.reviewer_id = b.homeowner_id
ORDER BY b.scheduled_date DESC;

CREATE OR REPLACE VIEW public.view_provider_next_payouts AS
SELECT
  (date_trunc('month', now()) + INTERVAL '14 days')::date        AS this_month_payout,
  (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date AS next_month_payout;

  DROP VIEW IF EXISTS public.view_provider_next_payouts;

CREATE VIEW public.view_provider_next_payouts AS
SELECT
  -- Payout on the 15th of this month
  (date_trunc('month', now()) + INTERVAL '14 days')::date           AS this_month_date,
  -- Sum of all completed jobs since last payout up to the 15th
  (
    SELECT COALESCE(SUM(amount), 0)
      FROM public.bookings
     WHERE provider_id    = auth.uid()
       AND status         = 'completed'
       AND scheduled_date > date_trunc('month', now()) - INTERVAL '1 month'
       AND scheduled_date <= date_trunc('month', now()) + INTERVAL '14 days'
  )                                                                 AS this_month_amount,

  -- Payout on the last day of the month
  (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date   AS next_month_date,
  -- Sum of all completed jobs from the 1st of this month through the end
  (
    SELECT COALESCE(SUM(amount), 0)
      FROM public.bookings
     WHERE provider_id    = auth.uid()
       AND status         = 'completed'
       AND scheduled_date > date_trunc('month', now())
       AND scheduled_date <= date_trunc('month', now()) + INTERVAL '1 month - 1 day'
  )                                                                 AS next_month_amount;

  -- 1) Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2) Standard read/write policies
CREATE POLICY "Homeowner can select own documents"
  ON public.documents FOR SELECT
  USING ( user_id = auth.uid() );

CREATE POLICY "Homeowner can delete own documents"
  ON public.documents FOR DELETE
  USING ( user_id = auth.uid() );

-- 3) INSERT policy that limits to 3 docs per user
CREATE POLICY "Limit to 3 docs per user"
  ON public.documents FOR INSERT
  WITH CHECK (
    (
      SELECT COUNT(*) 
        FROM public.documents 
       WHERE user_id = auth.uid()
    ) < 3
  );

  -- 1) Enable RLS on storage.objects (only needs doing once)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2) Insert policy
DROP POLICY IF EXISTS "Users can upload own docs" ON storage.objects;
CREATE POLICY "Users can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() = (metadata->>'user_id')::uuid
  );

-- 3) Select policy
DROP POLICY IF EXISTS "Users can list own docs" ON storage.objects;
CREATE POLICY "Users can list own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid() = (metadata->>'user_id')::uuid
  );

-- 4) Delete policy
DROP POLICY IF EXISTS "Users can delete own docs" ON storage.objects;
CREATE POLICY "Users can delete own docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid() = (metadata->>'user_id')::uuid
  );

  ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone           text,
  ADD COLUMN IF NOT EXISTS company_name    text,
  ADD COLUMN IF NOT EXISTS experience_years integer,
  ADD COLUMN IF NOT EXISTS service_types   text[],       -- array of services
  ADD COLUMN IF NOT EXISTS service_area    text,
  ADD COLUMN IF NOT EXISTS hourly_rate     numeric(10,2),
  ADD COLUMN IF NOT EXISTS license_number  text,
  ADD COLUMN IF NOT EXISTS insurance_url   text,         -- stored in storage bucket
  ADD COLUMN IF NOT EXISTS license_url     text,
  ADD COLUMN IF NOT EXISTS portfolio_url   text,
  ADD COLUMN IF NOT EXISTS "references"    jsonb,        -- [{ name, email }]
  ADD COLUMN IF NOT EXISTS availability    text[],       -- e.g. ['Mon','Tue']
  ADD COLUMN IF NOT EXISTS on_call         boolean       DEFAULT false;

  -- 1) Create the plans master table (max_homes allows NULL for "unlimited")
CREATE TABLE IF NOT EXISTS public.plans (
  id                  SERIAL      PRIMARY KEY,
  name                TEXT        UNIQUE NOT NULL,
  price               NUMERIC(6,2) NOT NULL,
  max_homes           INTEGER,                    -- now allows NULL
  unlimited_reminders BOOLEAN     NOT NULL DEFAULT FALSE,
  report_access       BOOLEAN     NOT NULL DEFAULT FALSE,
  priority_support    BOOLEAN     NOT NULL DEFAULT FALSE
);

-- 2) Seed your three tiers
INSERT INTO public.plans (name, price, max_homes, unlimited_reminders, report_access, priority_support)
  VALUES
    ('Free',     0.00, 1,     FALSE, FALSE, FALSE),
    ('Core',     7.00, 3,     TRUE,  TRUE,  FALSE),
    ('Premium', 20.00, NULL,  TRUE,  TRUE,  TRUE)
  ON CONFLICT (name) DO UPDATE
    SET price               = EXCLUDED.price,
        max_homes           = EXCLUDED.max_homes,
        unlimited_reminders = EXCLUDED.unlimited_reminders,
        report_access       = EXCLUDED.report_access,
        priority_support    = EXCLUDED.priority_support;

-- 3) Continue with your onboarding schema:

-- Track which plan each user chose
CREATE TABLE IF NOT EXISTS public.user_plans (
  user_id    UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id    INT       REFERENCES public.plans(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- User properties
CREATE TABLE IF NOT EXISTS public.properties (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID     REFERENCES auth.users(id) ON DELETE CASCADE,
  address       TEXT     NOT NULL,
  year_built    INT,
  property_type TEXT,
  region        TEXT,
  nickname      TEXT,    -- Optional custom name/nickname for the property
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master tasks per region and plan
CREATE TABLE IF NOT EXISTS public.master_tasks (
  id          SERIAL PRIMARY KEY,
  name        TEXT   NOT NULL,
  description TEXT,
  region      TEXT,
  plan_name   TEXT   NOT NULL,
  priority    TEXT   DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  default_offset_days INT NOT NULL DEFAULT 0,
  due_month   INT CHECK (due_month BETWEEN 1 AND 12)
);

-- Link which tasks each user has loaded
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID    REFERENCES public.properties(id) ON DELETE CASCADE,
  task_id     INT     REFERENCES public.master_tasks(id) ON DELETE CASCADE,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT    CHECK (completed_by IN ('diy','professional')),
  due_date    DATE    NOT NULL DEFAULT CURRENT_DATE,
  priority    TEXT    DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  reminder_sent_1day BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_sent_7day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track onboarding progress
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id     UUID     PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT     NOT NULL DEFAULT 1,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) RLS policies
ALTER TABLE public.user_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can manage their own plan"
  ON public.user_plans FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own properties"
  ON public.properties FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own tasks"
  ON public.user_tasks FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own onboarding"
  ON public.user_onboarding FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

  -- RLS Policies for User Plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own plans" ON public.user_plans;
CREATE POLICY "Users can read their own plans"
  ON public.user_plans
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own plans" ON public.user_plans;
CREATE POLICY "Users can create their own plans"
  ON public.user_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own plans" ON public.user_plans;
CREATE POLICY "Users can update their own plans"
  ON public.user_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plans" ON public.user_plans;
CREATE POLICY "Users can delete their own plans"
  ON public.user_plans
  FOR DELETE
  USING (auth.uid() = user_id);


-- RLS Policies for Onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own onboarding data" ON public.user_onboarding;
CREATE POLICY "Users can read their own onboarding data"
  ON public.user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own onboarding data" ON public.user_onboarding;
CREATE POLICY "Users can create their own onboarding data"
  ON public.user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.user_onboarding;
CREATE POLICY "Users can update their own onboarding data"
  ON public.user_onboarding
  FOR UPDATE
  USING (auth.uid() = user_id);

  CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  plan_id UUID REFERENCES public.plans(id),
  property_id UUID REFERENCES public.properties(id),  -- This is defined in the schema file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1) Create a helper function that seeds tasks for the CURRENT USER
create or replace function public.seed_user_tasks_for_current_user()
returns void
security definer
language plpgsql
as $$
begin
  insert into public.user_tasks (user_id, property_id, task_id)
  select
    p.user_id,
    p.id       as property_id,
    mt.id      as task_id
  from public.properties p
    join public.user_plans up    on up.user_id = p.user_id
    join public.plans pl         on pl.id       = up.plan_id
    join public.master_tasks mt  on mt.region   = p.region
                                and mt.plan_name = pl.name
  where p.user_id = auth.uid()
  on conflict do nothing;  -- in case they hit "looks good" twice
end;
$$;

-- 2) (Optional) Create a view so you can easily fetch those seeded tasks in your UpcomingTasks widget:
create or replace view public.view_user_tasks as
select
  ut.id,
  ut.user_id,
  ut.property_id,
  mt.name        as title,
  mt.description as description,
  ut.completed,
  ut.created_at
from public.user_tasks ut
  join public.master_tasks mt on mt.id = ut.task_id
where ut.user_id = auth.uid()
order by mt.id;

-- 3) Grant your Row-Level policies on user_tasks if you haven't already:
alter table public.user_tasks enable row level security;

create policy "Users can see & insert their own tasks"
  on public.user_tasks for all
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

  -- Southeast region tasks
INSERT INTO public.master_tasks (name, description, region, plan_name)
VALUES
  -- Essentials (Free)
  ('Treat for ants and roaches',           'Bimonthly',   'Southeast','Free'),
  ('Inspect HVAC system',                  'Biannually',  'Southeast','Free'),
  ('Clean gutters after storms',           'Quarterly',   'Southeast','Free'),
  ('Test smoke and CO detectors',          'Monthly',     'Southeast','Free'),
  ('Trim vegetation near home',            'Quarterly',   'Southeast','Free'),

  -- Smart Habits (Core)
  ('Flush garbage disposal',               'Monthly',     'Southeast','Core'),
  ('Inspect bathroom caulking for mold',   'Quarterly',   'Southeast','Core'),
  ('Check attic ventilation',              'Quarterly',   'Southeast','Core'),
  ('Clean bathroom exhaust fans',          'Quarterly',   'Southeast','Core'),
  ('Reverse ceiling fans',                 'Biannually',  'Southeast','Core'),

  -- Nice-to-Haves (Premium)
  ('Power wash siding',                    'Biannually',  'Southeast','Premium'),
  ('Organize storage sheds',               'Quarterly',   'Southeast','Premium'),
  ('Inspect irrigation system',            'Quarterly',   'Southeast','Premium'),
  ('Clean exterior lights',                'Quarterly',   'Southeast','Premium'),
  ('Check for termite mud tubes',          'Quarterly',   'Southeast','Premium'),

  -- Other Recommended (Premium)
  ('Test sump pump or drainage system',    'Biannually',  'Southeast','Premium'),
  ('Inspect crawlspace for moisture',      'Quarterly',   'Southeast','Premium'),
  ('Clean window screens',                 'Biannually',  'Southeast','Premium'),
  ('Lubricate garage door springs',        'Biannually',  'Southeast','Premium'),
  ('Inspect outdoor faucets for leaks',    'Quarterly',   'Southeast','Premium')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  region     TEXT;
  region_list TEXT[] := ARRAY[
    'Northeast',
    'Mid-Atlantic',
    'Southeast',
    'South Central',
    'Midwest',
    'Southwest',
    'Mountain',
    'Pacific Northwest',
    'Pacific Southwest'
  ];
BEGIN
  FOREACH region IN ARRAY region_list
  LOOP
    INSERT INTO public.master_tasks (name, description, region, plan_name)
    VALUES
      -- 5 Essentials (Free tier)
      ('Treat for ants and roaches',           'Bimonthly',     region, 'Free'),
      ('Inspect HVAC system',                  'Biannually',    region, 'Free'),
      ('Clean gutters after storms',           'Quarterly',     region, 'Free'),
      ('Test smoke and CO detectors',          'Monthly',       region, 'Free'),
      ('Trim vegetation near home',            'Quarterly',     region, 'Free'),

      -- 5 Smart Habits (Core tier)
      ('Flush garbage disposal',               'Monthly',       region, 'Core'),
      ('Inspect bathroom caulking for mold',   'Quarterly',     region, 'Core'),
      ('Check attic ventilation',              'Quarterly',     region, 'Core'),
      ('Clean bathroom exhaust fans',          'Quarterly',      region, 'Core'),
      ('Reverse ceiling fans',                 'Biannually',    region, 'Core'),

      -- 10 Premium tasks (Premium tier)
      -- Nice-to-Haves
      ('Power wash siding',                    'Biannually',    region, 'Premium'),
      ('Organize storage sheds',               'Quarterly',     region, 'Premium'),
      ('Inspect irrigation system',            'Quarterly',     region, 'Premium'),
      ('Clean exterior lights',                'Quarterly',     region, 'Premium'),
      ('Check for termite mud tubes',          'Quarterly',     region, 'Premium'),
      -- Other Recommended
      ('Test sump pump or drainage system',    'Biannually',    region, 'Premium'),
      ('Inspect crawlspace for moisture',      'Quarterly',     region, 'Premium'),
      ('Clean window screens',                 'Biannually',    region, 'Premium'),
      ('Lubricate garage door springs',        'Biannually',    region, 'Premium'),
      ('Inspect outdoor faucets for leaks',    'Quarterly',     region, 'Premium')
    ON CONFLICT DO NOTHING;  -- safely skip duplicates
  END LOOP;
END
$$;

-- 1) Set up master_tasks table if it isn't already
CREATE TABLE IF NOT EXISTS public.master_tasks (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  region      TEXT        NOT NULL,
  plan_name   TEXT        NOT NULL,
  priority    TEXT        DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  default_offset_days INT NOT NULL DEFAULT 0,
  due_month   INT CHECK (due_month BETWEEN 1 AND 12)
);

-- 2) Seed all regions with 20 tasks apiece
INSERT INTO public.master_tasks (name, description, region, plan_name)
VALUES

-- Northeast Region ----------------------------------------------------
-- Essentials
('Test smoke and CO detectors',          'Monthly',        'Northeast','Free'),
('Service boiler or furnace',            'Annually',       'Northeast','Free'),
('Clean chimney/fireplace',              'Annually',       'Northeast','Free'),
('Check and insulate exposed pipes',     'Annually',       'Northeast','Free'),
('Seal windows and doors',               'Annually',       'Northeast','Free'),
-- Smart Habits
('Flush water heater',                   'Biannually',     'Northeast','Core'),
('Check basement for leaks',             'Monthly',        'Northeast','Core'),
('Inspect attic for insulation gaps',    'Quarterly',      'Northeast','Core'),
('Reverse ceiling fans for winter/summer','Biannually',    'Northeast','Core'),
('Inspect sump pump',                    'Quarterly',      'Northeast','Core'),
-- Nice-to-Haves
('Vacuum refrigerator coils',            'Biannually',     'Northeast','Premium'),
('Clean bathroom exhaust fans',          'Quarterly',      'Northeast','Premium'),
('Wash windows',                         'Biannually',     'Northeast','Premium'),
('Touch up exterior paint',              'Annually',       'Northeast','Premium'),
('Clean dehumidifiers',                  'Monthly',        'Northeast','Premium'),
-- Other Recommended
('Organize seasonal gear in garage',     'Quarterly',      'Northeast','Premium'),
('Check driveway for cracks',            'Annually',       'Northeast','Premium'),
('Inspect water shut-off valves',        'Annually',       'Northeast','Premium'),
('Edge lawn borders',                    'Seasonally',     'Northeast','Premium'),
('Clean and store outdoor furniture',    'Seasonally',     'Northeast','Premium'),

-- Mid-Atlantic Region -------------------------------------------------
-- Essentials
('Treat for ants and roaches',           'Bimonthly',      'Mid-Atlantic','Free'),
('Inspect HVAC system',                  'Biannually',     'Mid-Atlantic','Free'),
('Clean gutters after storms',           'Quarterly',      'Mid-Atlantic','Free'),
('Test smoke and CO detectors',          'Monthly',        'Mid-Atlantic','Free'),
('Trim vegetation near home',            'Quarterly',      'Mid-Atlantic','Free'),
-- Smart Habits
('Flush garbage disposal',               'Monthly',        'Mid-Atlantic','Core'),
('Inspect bathroom caulking for mold',   'Quarterly',      'Mid-Atlantic','Core'),
('Check attic ventilation',              'Quarterly',      'Mid-Atlantic','Core'),
('Clean bathroom exhaust fans',          'Quarterly',      'Mid-Atlantic','Core'),
('Reverse ceiling fans',                 'Biannually',     'Mid-Atlantic','Core'),
-- Nice-to-Haves
('Power wash siding',                    'Biannually',     'Mid-Atlantic','Premium'),
('Organize storage sheds',               'Quarterly',      'Mid-Atlantic','Premium'),
('Inspect irrigation system',            'Quarterly',      'Mid-Atlantic','Premium'),
('Clean exterior lights',                'Quarterly',      'Mid-Atlantic','Premium'),
('Check for termite mud tubes',          'Quarterly',      'Mid-Atlantic','Premium'),
-- Other Recommended
('Test sump pump or drainage system',    'Biannually',     'Mid-Atlantic','Premium'),
('Inspect crawlspace for moisture',      'Quarterly',      'Mid-Atlantic','Premium'),
('Clean window screens',                 'Biannually',     'Mid-Atlantic','Premium'),
('Lubricate garage door springs',        'Biannually',     'Mid-Atlantic','Premium'),
('Inspect outdoor faucets for leaks',    'Quarterly',      'Mid-Atlantic','Premium'),

-- Midwest Region ------------------------------------------------------
-- Essentials
('Insulate pipes before winter',         'Annually',       'Midwest','Free'),
('Service furnace',                      'Annually',       'Midwest','Free'),
('Check sump pump',                      'Quarterly',      'Midwest','Free'),
('Test smoke and CO detectors',          'Monthly',        'Midwest','Free'),
('Inspect roof and gutters',             'Biannually',     'Midwest','Free'),
-- Smart Habits
('Flush water heater',                   'Biannually',     'Midwest','Core'),
('Clean dryer vent',                     'Quarterly',      'Midwest','Core'),
('Seal windows and doors',               'Annually',       'Midwest','Core'),
('Clean bathroom fans',                  'Quarterly',      'Midwest','Core'),
('Inspect basement for water intrusion', 'Monthly',        'Midwest','Core'),
-- Nice-to-Haves
('Check snow blower and supplies',       'Annually',       'Midwest','Premium'),
('Clean and reverse ceiling fans',       'Biannually',     'Midwest','Premium'),
('Organize garage tools',                'Quarterly',      'Midwest','Premium'),
('Edge lawn and reseed',                 'Biannually',     'Midwest','Premium'),
('Inspect exterior siding for damage',   'Biannually',     'Midwest','Premium'),
-- Other Recommended
('Clean dehumidifier filters',           'Monthly',        'Midwest','Premium'),
('Clean refrigerator coils',             'Biannually',     'Midwest','Premium'),
('Check attic insulation levels',        'Annually',       'Midwest','Premium'),
('Inspect driveway for cracks',          'Annually',       'Midwest','Premium'),
('Clean out garden beds',                'Seasonally',     'Midwest','Premium'),

-- Southeast Region ----------------------------------------------------
-- Essentials
('Treat for ants and roaches',           'Bimonthly',      'Southeast','Free'),
('Inspect HVAC system',                  'Biannually',     'Southeast','Free'),
('Clean gutters after storms',           'Quarterly',      'Southeast','Free'),
('Test smoke and CO detectors',          'Monthly',        'Southeast','Free'),
('Trim vegetation near home',            'Quarterly',      'Southeast','Free'),
-- Smart Habits
('Flush garbage disposal',               'Monthly',        'Southeast','Core'),
('Inspect bathroom caulking for mold',   'Quarterly',      'Southeast','Core'),
('Check attic ventilation',              'Quarterly',      'Southeast','Core'),
('Clean bathroom exhaust fans',          'Quarterly',      'Southeast','Core'),
('Reverse ceiling fans',                 'Biannually',     'Southeast','Core'),
-- Nice-to-Haves
('Power wash siding',                    'Biannually',     'Southeast','Premium'),
('Organize storage sheds',               'Quarterly',      'Southeast','Premium'),
('Inspect irrigation system',            'Quarterly',      'Southeast','Premium'),
('Clean exterior lights',                'Quarterly',      'Southeast','Premium'),
('Check for termite mud tubes',          'Quarterly',      'Southeast','Premium'),
-- Other Recommended
('Test sump pump or drainage system',    'Biannually',     'Southeast','Premium'),
('Inspect crawlspace for moisture',      'Quarterly',      'Southeast','Premium'),
('Clean window screens',                 'Biannually',     'Southeast','Premium'),
('Lubricate garage door springs',        'Biannually',     'Southeast','Premium'),
('Inspect outdoor faucets for leaks',    'Quarterly',      'Southeast','Premium'),

-- South Central Region ------------------------------------------------
-- Essentials
('Change HVAC filters',                  'Every 2-3 months','South Central','Free'),
('Treat perimeter for pests and fire ants','Bimonthly',     'South Central','Free'),
('Flush water heater',                   'Annually',       'South Central','Free'),
('Test smoke and CO detectors',          'Monthly',        'South Central','Free'),
('Inspect sprinkler/irrigation system',  'Quarterly',      'South Central','Free'),
-- Smart Habits
('Clean dryer vent',                     'Quarterly',      'South Central','Core'),
('Flush garbage disposal with vinegar',  'Monthly',        'South Central','Core'),
('Inspect attic for heat damage or pests','Quarterly',     'South Central','Core'),
('Check garage door safety sensors',     'Quarterly',      'South Central','Core'),
('Clean bathroom exhaust fans',          'Quarterly',      'South Central','Core'),
-- Nice-to-Haves
('Power wash driveway and walkways',     'Biannually',     'South Central','Premium'),
('Clean exterior light fixtures',        'Quarterly',      'South Central','Premium'),
('Check and seal windows/doors',         'Biannually',     'South Central','Premium'),
('Wash exterior windows',                'Biannually',     'South Central','Premium'),
('Vacuum refrigerator coils',            'Biannually',     'South Central','Premium'),
-- Other Recommended
('Organize garage or outdoor storage',   'Quarterly',      'South Central','Premium'),
('Inspect fence/gate latches and hinges','Biannually',     'South Central','Premium'),
('Inspect roof for storm or hail damage','After storms',   'South Central','Premium'),
('Clean and reverse ceiling fans',       'Biannually',     'South Central','Premium'),
('Inspect caulking in kitchen and bathrooms','Biannually', 'South Central','Premium'),

-- Southwest Region ----------------------------------------------------
-- Essentials
('Change HVAC filters',                  'Every 2-3 months','Southwest','Free'),
('Treat for scorpions and pests',        'Bimonthly',      'Southwest','Free'),
('Inspect roof for sun or heat damage',  'Biannually',     'Southwest','Free'),
('Flush water heater',                   'Annually',       'Southwest','Free'),
('Test smoke and CO detectors',          'Monthly',        'Southwest','Free'),
-- Smart Habits
('Check and seal doors/windows for drafts','Biannually',     'Southwest','Core'),
('Clean bathroom exhaust fans',          'Quarterly',      'Southwest','Core'),
('Inspect attic for heat buildup',       'Quarterly',      'Southwest','Core'),
('Clean refrigerator coils',             'Biannually',     'Southwest','Core'),
('Flush disposal with vinegar and ice',  'Monthly',        'Southwest','Core'),
-- Nice-to-Haves
('Wash windows and screens',             'Biannually',     'Southwest','Premium'),
('Power wash patio and hardscape',       'Biannually',     'Southwest','Premium'),
('Check irrigation emitters',            'Quarterly',      'Southwest','Premium'),
('Vacuum garage corners for spider webs','Monthly',         'Southwest','Premium'),
('Organize outdoor storage bins',        'Quarterly',      'Southwest','Premium'),
-- Other Recommended
('Clean solar panel surface',            'Biannually',     'Southwest','Premium'),
('Inspect caulking around sinks and tubs','Biannually',     'Southwest','Premium'),
('Wipe salt and dust from outdoor furniture','Monthly',     'Southwest','Premium'),
('Inspect fencing for sun damage',       'Annually',       'Southwest','Premium'),
('Lubricate gate and garage hinges',     'Biannually',     'Southwest','Premium'),

-- Mountain States Region ---------------------------------------------
-- Essentials
('Test CO detectors and smoke alarms',    'Monthly',        'Mountain States','Free'),
('Service heating system',               'Annually',       'Mountain States','Free'),
('Seal driveway cracks',                 'Annually',       'Mountain States','Free'),
('Flush water heater',                   'Annually',       'Mountain States','Free'),
('Inspect and insulate exposed pipes',   'Annually',       'Mountain States','Free'),
-- Smart Habits
('Inspect attic for pests or heat loss', 'Quarterly',      'Mountain States','Core'),
('Clean and reverse ceiling fans',       'Biannually',     'Mountain States','Core'),
('Clean dryer vent',                     'Quarterly',      'Mountain States','Core'),
('Check sump pump',                      'Quarterly',      'Mountain States','Core'),
('Inspect basement for moisture',        'Monthly',        'Mountain States','Core'),
-- Nice-to-Haves
('Clean outdoor grills',                 'Seasonally',     'Mountain States','Premium'),
('Vacuum refrigerator coils',            'Biannually',     'Mountain States','Premium'),
('Wash and store patio cushions',        'Biannually',     'Mountain States','Premium'),
('Touch up exterior paint',              'Annually',       'Mountain States','Premium'),
('Inspect caulking and weather seals',   'Biannually',     'Mountain States','Premium'),
-- Other Recommended
('Organize winter gear',                 'Seasonally',     'Mountain States','Premium'),
('Clean gutters',                        'Quarterly',      'Mountain States','Premium'),
('Inspect chimney cap',                  'Annually',       'Mountain States','Premium'),
('Power wash deck and stairs',           'Biannually',     'Mountain States','Premium'),
('Check lighting timers',                'Quarterly',      'Mountain States','Premium'),

-- Pacific Northwest Region --------------------------------------------
-- Essentials
('Clean moss from roof and walkways',     'Quarterly',      'Pacific Northwest','Free'),
('Inspect gutters for debris',            'Quarterly',      'Pacific Northwest','Free'),
('Test smoke and CO detectors',           'Monthly',        'Pacific Northwest','Free'),
('Service heating system',                'Annually',       'Pacific Northwest','Free'),
('Check crawlspaces for water or mold',   'Quarterly',      'Pacific Northwest','Free'),
-- Smart Habits
('Flush water heater',                    'Biannually',     'Pacific Northwest','Core'),
('Check sump pump function',              'Quarterly',      'Pacific Northwest','Core'),
('Inspect attic for condensation or mold','Quarterly',      'Pacific Northwest','Core'),
('Clean window sills and frames',         'Monthly',        'Pacific Northwest','Core'),
('Clean or replace furnace filters',      'Every 3 months', 'Pacific Northwest','Core'),
-- Nice-to-Haves
('Power wash walkways and patios',        'Biannually',     'Pacific Northwest','Premium'),
('Organize garden tools and supplies',    'Quarterly',      'Pacific Northwest','Premium'),
('Edge flower beds',                      'Seasonally',     'Pacific Northwest','Premium'),
('Wipe down light fixtures',              'Quarterly',      'Pacific Northwest','Premium'),
('Inspect exterior wood trim for rot',    'Biannually',     'Pacific Northwest','Premium'),
-- Other Recommended
('Wash mildew-prone siding',              'Biannually',     'Pacific Northwest','Premium'),
('Maintain rainwater drainage systems',   'Quarterly',      'Pacific Northwest','Premium'),
('Lubricate garage door tracks',          'Biannually',     'Pacific Northwest','Premium'),
('Clean out basement window wells',       'Quarterly',      'Pacific Northwest','Premium'),
('Clear leaves from downspouts',          'Monthly in fall','Pacific Northwest','Premium'),

-- West Coast Region --------------------------------------------------
-- Essentials
('Clean HVAC filters',                    'Every 3 months', 'West Coast','Free'),
('Inspect roof and gutters for wildfire debris','Quarterly', 'West Coast','Free'),
('Test earthquake kit/emergency supplies','Annually',       'West Coast','Free'),
('Treat for termites',                    'Annually',       'West Coast','Free'),
('Trim defensible space around home',      'Biannually',     'West Coast','Free'),
-- Smart Habits
('Flush water heater',                    'Biannually',     'West Coast','Core'),
('Clean solar panels',                    'Biannually',     'West Coast','Core'),
('Test GFCI outlets',                     'Quarterly',      'West Coast','Core'),
('Inspect irrigation for leaks',           'Quarterly',      'West Coast','Core'),
('Inspect and lubricate sliding doors',    'Quarterly',      'West Coast','Core'),
-- Nice-to-Haves
('Wash salt residue from exterior',        'Monthly in coastal zones','West Coast','Premium'),
('Organize garage or storage shed',        'Quarterly',      'West Coast','Premium'),
('Clean window tracks and screens',        'Quarterly',      'West Coast','Premium'),
('Inspect caulking/seals around windows and doors','Biannually','West Coast','Premium'),
('Clean and store outdoor furniture',      'Seasonally',     'West Coast','Premium'),
-- Other Recommended
('Check landscape lighting',               'Monthly',        'West Coast','Premium'),
('Test attic fans or vents',               'Quarterly',      'West Coast','Premium'),
('Check home for dry rot and mildew',      'Quarterly',      'West Coast','Premium'),
('Inspect pool/spa equipment if present',  'Monthly',        'West Coast','Premium'),
('Inspect washing machine hoses',          'Annually',       'West Coast','Premium'),

-- Alaska Region ------------------------------------------------------
-- Essentials
('Seal windows and doors before winter',   'Annually',       'Alaska','Free'),
('Test backup generator',                 'Annually',       'Alaska','Free'),
('Check heating fuel/oil supply',         'Monthly in winter','Alaska','Free'),
('Inspect roof for ice damage',           'Quarterly',      'Alaska','Free'),
('Clear snow from vents and exhausts',    'After snowfall', 'Alaska','Free'),
-- Smart Habits
('Inspect attic and crawlspace for heat loss','Quarterly',  'Alaska','Core'),
('Test carbon monoxide detectors',        'Monthly',        'Alaska','Core'),
('Flush water heater',                    'Annually',       'Alaska','Core'),
('Check for frozen pipe risks',           'Monthly in winter','Alaska','Core'),
('Service heating system',                'Annually',       'Alaska','Core'),
-- Nice-to-Haves
('Organize winter gear storage',          'Seasonally',     'Alaska','Premium'),
('Clean snowblower and lubricate parts',  'Annually',       'Alaska','Premium'),
('Clean salt from garage/carport',        'Monthly in winter','Alaska','Premium'),
('Test roof heating cables',              'Annually',       'Alaska','Premium'),
('Wash entry mats and mudroom surfaces',  'Monthly',        'Alaska','Premium'),
-- Other Recommended
('Lubricate door hinges and locks',       'Biannually',     'Alaska','Premium'),
('Inspect thermal windows for condensation','Quarterly',     'Alaska','Premium'),
('Vacuum baseboard heaters',              'Quarterly',      'Alaska','Premium'),
('Check weather stripping',               'Biannually',     'Alaska','Premium'),
('Inspect exterior lighting',             'Quarterly',      'Alaska','Premium'),

-- Hawaii Region ------------------------------------------------------
-- Essentials
('Treat for termites and pests',          'Bimonthly',      'Hawaii','Free'),
('Inspect roof and flashing',             'Biannually',     'Hawaii','Free'),
('Clean dehumidifiers',                   'Monthly',        'Hawaii','Free'),
('Flush and test water heater',           'Quarterly',      'Hawaii','Free'),
('Check GFCI outlets',                    'Quarterly',      'Hawaii','Free'),
-- Smart Habits
('Check for mold and mildew',             'Monthly',        'Hawaii','Core'),
('Trim tropical plants and trees',        'Quarterly',      'Hawaii','Core'),
('Inspect wooden decks and structures',   'Biannually',     'Hawaii','Core'),
('Wash windows for salt buildup',         'Monthly',        'Hawaii','Core'),
('Monitor indoor humidity levels',        'Monthly',        'Hawaii','Core'),
-- Nice-to-Haves
('Clean solar panels',                    'Biannually',     'Hawaii','Premium'),
('Organize lanai or patio storage',       'Quarterly',      'Hawaii','Premium'),
('Inspect pool equipment',                'Monthly if applicable','Hawaii','Premium'),
('Maintain outdoor grills and kitchens',  'Monthly',        'Hawaii','Premium'),
('Wipe down exterior lights',             'Monthly',        'Hawaii','Premium'),
-- Other Recommended
('Clean and store beach gear',            'Weekly in summer','Hawaii','Premium'),
('Check outdoor furniture for rust or rot','Quarterly',     'Hawaii','Premium'),
('Wash siding and fences',                'Biannually',     'Hawaii','Premium'),
('Inspect window screens and doors',      'Quarterly',      'Hawaii','Premium'),
('Service air conditioning system',       'Annually',       'Hawaii','Premium')

ON CONFLICT DO NOTHING;

-- 1) Add any missing columns to user_onboarding
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS plan_id     INT    REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS property_id UUID   REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS region      TEXT;

-- 2) Make sure RLS is on
ALTER TABLE public.user_onboarding
  ENABLE ROW LEVEL SECURITY;

-- 3) Replace the old policy if it exists, then create it fresh
DROP POLICY IF EXISTS "User can manage own onboarding" ON public.user_onboarding;

CREATE POLICY "User can manage own onboarding"
  ON public.user_onboarding FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

  CREATE OR REPLACE FUNCTION public.seed_user_tasks_for_current_user()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  u          UUID;
  prop_id    UUID;
  user_region TEXT;
  plan_row   RECORD;
BEGIN
  u := auth.uid();

  -- 1) find their property + region
  SELECT id, region
    INTO prop_id, user_region
    FROM public.properties
   WHERE user_id = u
   LIMIT 1;

  -- 2) find their plan
  SELECT p.id AS plan_id, p.name AS plan_name
    INTO plan_row
    FROM public.user_plans up
    JOIN public.plans p ON p.id = up.plan_id
   WHERE up.user_id = u
   LIMIT 1;

  -- 3) insert all the master_tasks for that region+plan
  INSERT INTO public.user_tasks (user_id, property_id, task_id)
  SELECT
    u,
    prop_id,
    mt.id
  FROM public.master_tasks mt
  WHERE mt.region    = user_region
    AND mt.plan_name = plan_row.plan_name
  ON CONFLICT (user_id, property_id, task_id) DO NOTHING;

END;
$$;

-- 1) Drop the old view if it exists
DROP VIEW IF EXISTS public.view_user_tasks;

-- 2) Re-create it with exactly the columns you want
CREATE VIEW public.view_user_tasks AS
SELECT
  ut.id,
  ut.task_id,
  mt.name        AS title,
  mt.description,
  ut.completed,
  ut.property_id
FROM public.user_tasks ut
JOIN public.master_tasks mt
  ON mt.id = ut.task_id
WHERE ut.user_id = auth.uid()
ORDER BY mt.plan_name, mt.region, mt.name;

ALTER TABLE public.user_tasks
ADD CONSTRAINT user_tasks_user_prop_task_unique
UNIQUE (user_id, property_id, task_id);

-- user_plans
DROP POLICY IF EXISTS "service_role full access on user_plans" ON public.user_plans;
CREATE POLICY "service_role full access on user_plans"
  ON public.user_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- properties
DROP POLICY IF EXISTS "service_role full access on properties" ON public.properties;
CREATE POLICY "service_role full access on properties"
  ON public.properties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- user_tasks
DROP POLICY IF EXISTS "service_role full access on user_tasks" ON public.user_tasks;
CREATE POLICY "service_role full access on user_tasks"
  ON public.user_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- user_onboarding
DROP POLICY IF EXISTS "service_role full access on user_onboarding" ON public.user_onboarding;
CREATE POLICY "service_role full access on user_onboarding"
  ON public.user_onboarding FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

  -- 1) user_plans
DROP POLICY IF EXISTS "service_role full access on user_plans" ON public.user_plans;
CREATE POLICY "service_role full access on user_plans"
  ON public.user_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) properties
DROP POLICY IF EXISTS "service_role full access on properties" ON public.properties;
CREATE POLICY "service_role full access on properties"
  ON public.properties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3) user_tasks
DROP POLICY IF EXISTS "service_role full access on user_tasks" ON public.user_tasks;
CREATE POLICY "service_role full access on user_tasks"
  ON public.user_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) user_onboarding
DROP POLICY IF EXISTS "service_role full access on user_onboarding" ON public.user_onboarding;
CREATE POLICY "service_role full access on user_onboarding"
  ON public.user_onboarding FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) bookings (homeowners & providers)
DROP POLICY IF EXISTS "service_role full access on bookings" ON public.bookings;
CREATE POLICY "service_role full access on bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6) tasks
DROP POLICY IF EXISTS "service_role full access on tasks" ON public.tasks;
CREATE POLICY "service_role full access on tasks"
  ON public.tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7) notifications
DROP POLICY IF EXISTS "service_role full access on notifications" ON public.notifications;
CREATE POLICY "service_role full access on notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8) reviews
DROP POLICY IF EXISTS "service_role full access on reviews" ON public.reviews;
CREATE POLICY "service_role full access on reviews"
  ON public.reviews FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9) storage.objects (for uploaded documents)
DROP POLICY IF EXISTS "service_role full access on storage_objects" ON storage.objects;
CREATE POLICY "service_role full access on storage_objects"
  ON storage.objects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

  -- 1) Disable RLS on every table that references auth.users
ALTER TABLE public.user_plans       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects        DISABLE ROW LEVEL SECURITY;

-- 2) Now go back to Supabase → Authentication → Users and delete your 4 test accounts.
--    They should cascade-clean all associated rows.

-- 3) Re-enable RLS on those tables so your per-user security policies are back in force
ALTER TABLE public.user_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects        ENABLE ROW LEVEL SECURITY;

-- 0) (Optional) double-check RLS is on
ALTER TABLE public.user_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- 1) Drop any existing per-user policies
DROP POLICY IF EXISTS "User can manage their own plan"       ON public.user_plans;
DROP POLICY IF EXISTS "User can manage their own properties" ON public.properties;
DROP POLICY IF EXISTS "User can manage their own tasks"      ON public.user_tasks;
DROP POLICY IF EXISTS "User can manage their own onboarding" ON public.user_onboarding;

-- 2) Re-create them
CREATE POLICY "User can manage their own plan"
  ON public.user_plans FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own properties"
  ON public.properties FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own tasks"
  ON public.user_tasks FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage their own onboarding"
  ON public.user_onboarding FOR ALL
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

  -- let the service_role bypass your RLS on onboarding tables
ALTER TABLE public.user_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- supabase.service_role can see anything here
CREATE POLICY service_role_full_access
  ON public.user_plans       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_full_access
  ON public.properties      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_full_access
  ON public.user_tasks      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_full_access
  ON public.user_onboarding FOR ALL USING (true) WITH CHECK (true);

-- add a unique key so ON CONFLICT(user_id,property_id,task_id) has something to target
ALTER TABLE public.user_tasks
ADD CONSTRAINT user_tasks_user_property_task_key
UNIQUE (user_id, property_id, task_id);

CREATE OR REPLACE FUNCTION public.seed_user_tasks_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as a superuser, so it bypasses RLS
AS $$
BEGIN
  INSERT INTO public.user_tasks (user_id, property_id, task_id)
  SELECT
    uo.user_id,
    p.id        AS property_id,
    mt.id       AS task_id
  FROM public.user_onboarding   uo
  JOIN public.properties        p  ON p.user_id = uo.user_id
  JOIN public.user_plans        up ON up.user_id = uo.user_id
  JOIN public.plans            pl  ON pl.id       = up.plan_id
  JOIN public.master_tasks     mt
    ON mt.plan_name = pl.name
   AND mt.region    = p.region
  ON CONFLICT (user_id, property_id, task_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE VIEW public.view_user_tasks AS
SELECT
  ut.id,
  ut.task_id,
  mt.name        AS title,
  mt.description,
  ut.completed,
  ut.property_id
FROM public.user_tasks ut
JOIN public.master_tasks mt
  ON mt.id = ut.task_id
WHERE ut.user_id = auth.uid()
ORDER BY mt.plan_name, mt.region, mt.name;

-- Create a function to allow deleting users with admin privileges
-- This function should only be callable with service_role key
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- First delete related user data that might block deletion due to foreign keys
  DELETE FROM auth.sessions WHERE auth.sessions.user_id = admin_delete_user.user_id;
  DELETE FROM auth.refresh_tokens WHERE auth.refresh_tokens.user_id = admin_delete_user.user_id;
  DELETE FROM auth.identities WHERE auth.identities.user_id = admin_delete_user.user_id;
  
  -- Delete data from public tables referencing this user
  -- Use cascade for profiles to handle other dependent tables
  DELETE FROM public.profiles WHERE id = admin_delete_user.user_id;
  
  -- Finally delete the user
  DELETE FROM auth.users WHERE id = admin_delete_user.user_id;
END;
$$;

-- Revoke access from public
REVOKE EXECUTE ON FUNCTION public.admin_delete_user FROM PUBLIC;

-- Grant access only to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO service_role; 

-- Create a function to force delete auth.users records when other methods fail
-- This function should only be callable with service_role key
CREATE OR REPLACE FUNCTION public.force_delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- First delete related user data that might block deletion
  EXECUTE 'DELETE FROM auth.sessions WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.identities WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_factors WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_challenges WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = $1)' USING target_user_id;
  
  -- Finally delete the user
  EXECUTE 'DELETE FROM auth.users WHERE id = $1' USING target_user_id;
END;
$$;

-- Revoke access from public
REVOKE EXECUTE ON FUNCTION public.force_delete_auth_user FROM PUBLIC;

-- Grant access only to service role
GRANT EXECUTE ON FUNCTION public.force_delete_auth_user TO service_role; 


-- Create a function to allow deleting users with admin privileges
-- This function should only be callable with service_role key
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- First delete related user data that might block deletion due to foreign keys
  DELETE FROM auth.sessions WHERE auth.sessions.user_id = admin_delete_user.user_id;
  DELETE FROM auth.refresh_tokens WHERE auth.refresh_tokens.user_id = admin_delete_user.user_id;
  DELETE FROM auth.identities WHERE auth.identities.user_id = admin_delete_user.user_id;
  
  -- Delete data from public tables referencing this user
  -- Use cascade for profiles to handle other dependent tables
  DELETE FROM public.profiles WHERE id = admin_delete_user.user_id;
  
  -- Finally delete the user
  DELETE FROM auth.users WHERE id = admin_delete_user.user_id;
END;
$$;

-- Create a function to force delete auth.users records when other methods fail
-- This function should only be callable with service_role key
CREATE OR REPLACE FUNCTION public.force_delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- First delete related user data that might block deletion
  EXECUTE 'DELETE FROM auth.sessions WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.identities WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_factors WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_challenges WHERE user_id = $1' USING target_user_id;
  EXECUTE 'DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = $1)' USING target_user_id;
  
  -- Finally delete the user
  EXECUTE 'DELETE FROM auth.users WHERE id = $1' USING target_user_id;
END;
$$;

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'master_tasks' 
AND table_schema = 'public';

-- Insert Southeast region tasks with proper capitalization
INSERT INTO public.master_tasks (name, description, region, plan_name)
VALUES
-- Essentials - Free tier
('Treat for ants and roaches', 'Apply pest control treatments around the perimeter of your home to prevent common pests.', 'Southeast', 'Free'),
('Inspect HVAC system', 'Check and clean your HVAC system to ensure proper functioning and efficiency.', 'Southeast', 'Free'),
('Clean gutters after storms', 'Remove debris from gutters to prevent water damage and ensure proper drainage.', 'Southeast', 'Free'),
('Test smoke and CO detectors', 'Ensure all safety devices are functioning properly to protect your home and family.', 'Southeast', 'Free'),
('Trim vegetation near home', 'Maintain proper clearance between plants and your home to prevent moisture and pest issues.', 'Southeast', 'Free'),

-- ==========================================
-- ENHANCED SCHEDULING SYSTEM
-- ==========================================

-- Provider unavailability (one-off "out of office" blocks)
CREATE TABLE IF NOT EXISTS public.provider_unavailability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES public.provider_profiles(user_id) ON DELETE CASCADE,
  start_ts      TIMESTAMPTZ NOT NULL,
  end_ts        TIMESTAMPTZ NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced booking status type
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending','confirmed','cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced provider bookings table (replaces or enhances existing bookings)
CREATE TABLE IF NOT EXISTS public.provider_bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID NOT NULL REFERENCES public.provider_profiles(user_id) ON DELETE CASCADE,
  homeowner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_ts       TIMESTAMPTZ NOT NULL,
  end_ts         TIMESTAMPTZ NOT NULL,
  service_type   TEXT NOT NULL,
  description    TEXT,
  status         booking_status NOT NULL DEFAULT 'pending',
  homeowner_notes TEXT,
  provider_notes  TEXT,
  image_urls     TEXT[] DEFAULT '{}',
  image_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.provider_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for provider_unavailability
CREATE POLICY "Provider can manage own unavailability"
  ON public.provider_unavailability FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Admin can manage all unavailability"
  ON public.provider_unavailability FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- RLS policies for provider_bookings
CREATE POLICY "Provider can view own bookings"
  ON public.provider_bookings FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Provider can update own bookings"
  ON public.provider_bookings FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Homeowner can manage own bookings"
  ON public.provider_bookings FOR ALL
  USING (homeowner_id = auth.uid())
  WITH CHECK (homeowner_id = auth.uid());

CREATE POLICY "Admin can manage all bookings"
  ON public.provider_bookings FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Triggers for updated_at
CREATE TRIGGER provider_bookings_updated_at
  BEFORE UPDATE ON public.provider_bookings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Slot generation function
CREATE OR REPLACE FUNCTION get_available_slots(
  p_provider UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_slot_mins INTEGER DEFAULT 30
) RETURNS TABLE(slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ) AS $$
DECLARE
  current_date DATE;
  end_date DATE;
  dow INTEGER;
  availability_record RECORD;
  slot_start_time TIMESTAMPTZ;
  slot_end_time TIMESTAMPTZ;
  current_slot_start TIMESTAMPTZ;
  current_slot_end TIMESTAMPTZ;
  has_conflict BOOLEAN;
BEGIN
  current_date := p_from::DATE;
  end_date := p_to::DATE;
  
  -- Loop through each date in the range
  WHILE current_date <= end_date LOOP
    dow := EXTRACT(DOW FROM current_date); -- 0=Sunday, 6=Saturday
    
    -- Get availability for this day of week
    FOR availability_record IN
      SELECT start_time, end_time, buffer_mins
      FROM public.provider_availability
      WHERE provider_id = p_provider AND day_of_week = dow
    LOOP
      -- Calculate actual start and end times for this date
      slot_start_time := current_date + availability_record.start_time;
      slot_end_time := current_date + availability_record.end_time;
      
      -- Only include slots within our requested time range
      IF slot_start_time >= p_from AND slot_end_time <= p_to THEN
        
        -- Generate slots within this availability window
        current_slot_start := slot_start_time;
        
        WHILE current_slot_start + INTERVAL '1 minute' * p_slot_mins <= slot_end_time LOOP
          current_slot_end := current_slot_start + INTERVAL '1 minute' * p_slot_mins;
          
          -- Check for conflicts with unavailability
          SELECT EXISTS (
            SELECT 1 FROM public.provider_unavailability
            WHERE provider_id = p_provider
            AND (start_ts <= current_slot_start AND end_ts > current_slot_start)
            OR (start_ts < current_slot_end AND end_ts >= current_slot_end)
            OR (start_ts >= current_slot_start AND end_ts <= current_slot_end)
          ) INTO has_conflict;
          
          -- Check for conflicts with existing bookings
          IF NOT has_conflict THEN
            SELECT EXISTS (
              SELECT 1 FROM public.provider_bookings
              WHERE provider_id = p_provider
              AND status IN ('pending', 'confirmed')
              AND (start_ts <= current_slot_start AND end_ts > current_slot_start)
              OR (start_ts < current_slot_end AND end_ts >= current_slot_end)
              OR (start_ts >= current_slot_start AND end_ts <= current_slot_end)
            ) INTO has_conflict;
          END IF;
          
          -- If no conflicts, return this slot
          IF NOT has_conflict THEN
            slot_start := current_slot_start;
            slot_end := current_slot_end;
            RETURN NEXT;
          END IF;
          
          -- Move to next slot (including buffer time)
          current_slot_start := current_slot_end + INTERVAL '1 minute' * availability_record.buffer_mins;
        END LOOP;
        
      END IF;
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enhanced availability table - add buffer_mins if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column exists, if not, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'provider_availability' 
                   AND column_name = 'buffer_mins') THEN
        ALTER TABLE public.provider_availability ADD COLUMN buffer_mins INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Update existing availability table to match expected structure
DO $$
BEGIN
    -- Rename buffer_min to buffer_mins if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'provider_availability' 
               AND column_name = 'buffer_min') THEN
        ALTER TABLE public.provider_availability RENAME COLUMN buffer_min TO buffer_mins;
    END IF;
END $$;

-- ==========================================
-- ENHANCED BOOKING VIEWS
-- ==========================================

-- Provider's booking calendar view
CREATE OR REPLACE VIEW public.view_provider_bookings AS
SELECT
  pb.id,
  pb.homeowner_id,
  pb.start_ts,
  pb.end_ts,
  pb.service_type,
  pb.description,
  pb.status,
  pb.homeowner_notes,
  pb.provider_notes,
  pb.created_at,
  pb.updated_at,
  u.email as homeowner_email,
  p.full_name as homeowner_name
FROM public.provider_bookings pb
LEFT JOIN auth.users u ON pb.homeowner_id = u.id
LEFT JOIN public.profiles p ON pb.homeowner_id = p.id
WHERE pb.provider_id = auth.uid()
ORDER BY pb.start_ts;

-- Homeowner's booking history view
CREATE OR REPLACE VIEW public.view_homeowner_bookings AS
SELECT
  pb.id,
  pb.provider_id,
  pb.start_ts,
  pb.end_ts,
  pb.service_type,
  pb.description,
  pb.status,
  pb.homeowner_notes,
  pb.provider_notes,
  pb.created_at,
  pb.updated_at,
  pp.business_name,
  pp.full_name as provider_name,
  pp.phone as provider_phone,
  pp.email as provider_email,
  CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
FROM public.provider_bookings pb
LEFT JOIN public.provider_profiles pp ON pb.provider_id = pp.user_id
LEFT JOIN public.reviews r ON r.booking_id = pb.id AND r.reviewer_id = pb.homeowner_id
WHERE pb.homeowner_id = auth.uid()
ORDER BY pb.start_ts DESC;

-- Note: Adding review_status column to provider_profiles table for consistency
-- This should be added to any CREATE TABLE statement for provider_profiles

-- Add the following column to provider_profiles table:
-- review_status TEXT NOT NULL DEFAULT 'pending'

-- ==========================================
-- HOLIDAYS SYSTEM
-- ==========================================

-- Create holidays table for storing major holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    date date NOT NULL,
    type text NOT NULL DEFAULT 'major' CHECK (type IN ('major', 'minor', 'religious', 'cultural')),
    recurring boolean DEFAULT true,
    description text,
    country text DEFAULT 'US',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create provider holiday preferences table
CREATE TABLE IF NOT EXISTS public.provider_holiday_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid NOT NULL REFERENCES provider_profiles(user_id) ON DELETE CASCADE,
    holiday_id uuid NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    blocks_availability boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(provider_id, holiday_id)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_holiday_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for holidays
CREATE POLICY "Holidays are viewable by everyone" ON public.holidays
    FOR SELECT USING (true);

-- Create RLS policies for holiday preferences
CREATE POLICY "Provider holiday preferences are viewable by the provider" ON public.provider_holiday_preferences
    FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Providers can manage their own holiday preferences" ON public.provider_holiday_preferences
    FOR ALL USING (provider_id = auth.uid());

-- Add trigger to update updated_at on holidays
CREATE TRIGGER update_holidays_updated_at 
    BEFORE UPDATE ON public.holidays 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common US holidays for 2024-2026 (if not already present)
INSERT INTO public.holidays (name, date, type, description) VALUES
    -- 2024 holidays
    ('New Year''s Day', '2024-01-01', 'major', 'New Year celebration'),
    ('Martin Luther King Jr. Day', '2024-01-15', 'major', 'Federal holiday honoring Martin Luther King Jr.'),
    ('Presidents'' Day', '2024-02-19', 'major', 'Federal holiday honoring all US presidents'),
    ('Memorial Day', '2024-05-27', 'major', 'Federal holiday honoring fallen military service members'),
    ('Independence Day', '2024-07-04', 'major', 'Independence Day celebration'),
    ('Labor Day', '2024-09-02', 'major', 'Federal holiday celebrating workers'),
    ('Columbus Day', '2024-10-14', 'minor', 'Federal holiday honoring Christopher Columbus'),
    ('Veterans Day', '2024-11-11', 'major', 'Federal holiday honoring military veterans'),
    ('Thanksgiving Day', '2024-11-28', 'major', 'Thanksgiving celebration'),
    ('Christmas Day', '2024-12-25', 'major', 'Christmas celebration'),
    
    -- 2025 holidays
    ('New Year''s Day', '2025-01-01', 'major', 'New Year celebration'),
    ('Martin Luther King Jr. Day', '2025-01-20', 'major', 'Federal holiday honoring Martin Luther King Jr.'),
    ('Presidents'' Day', '2025-02-17', 'major', 'Federal holiday honoring all US presidents'),
    ('Memorial Day', '2025-05-26', 'major', 'Federal holiday honoring fallen military service members'),
    ('Independence Day', '2025-07-04', 'major', 'Independence Day celebration'),
    ('Labor Day', '2025-09-01', 'major', 'Federal holiday celebrating workers'),
    ('Columbus Day', '2025-10-13', 'minor', 'Federal holiday honoring Christopher Columbus'),
    ('Veterans Day', '2025-11-11', 'major', 'Federal holiday honoring military veterans'),
    ('Thanksgiving Day', '2025-11-27', 'major', 'Thanksgiving celebration'),
    ('Christmas Day', '2025-12-25', 'major', 'Christmas celebration'),
    
    -- 2026 holidays
    ('New Year''s Day', '2026-01-01', 'major', 'New Year celebration'),
    ('Martin Luther King Jr. Day', '2026-01-19', 'major', 'Federal holiday honoring Martin Luther King Jr.'),
    ('Presidents'' Day', '2026-02-16', 'major', 'Federal holiday honoring all US presidents'),
    ('Memorial Day', '2026-05-25', 'major', 'Federal holiday honoring fallen military service members'),
    ('Independence Day', '2026-07-04', 'major', 'Independence Day celebration'),
    ('Labor Day', '2026-09-07', 'major', 'Federal holiday celebrating workers'),
    ('Columbus Day', '2026-10-12', 'minor', 'Federal holiday honoring Christopher Columbus'),
    ('Veterans Day', '2026-11-11', 'major', 'Federal holiday honoring military veterans'),
    ('Thanksgiving Day', '2026-11-26', 'major', 'Thanksgiving celebration'),
    ('Christmas Day', '2026-12-25', 'major', 'Christmas celebration')
ON CONFLICT (name, date) DO NOTHING;

-- Enhanced slot generation function that considers holiday preferences
CREATE OR REPLACE FUNCTION get_available_slots(
    p_provider uuid,
    p_from timestamptz,
    p_to timestamptz,
    p_slot_mins integer DEFAULT 30
)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
    loop_date date;
    end_date date;
    dow integer;
    avail_record record;
    slot_start timestamptz;
    slot_end timestamptz;
    day_start timestamptz;
    day_end timestamptz;
    buffer_mins integer;
    blocked_holiday boolean;
BEGIN
    loop_date := p_from::date;
    end_date := p_to::date;
    
    -- Loop through each date in the range
    WHILE loop_date <= end_date LOOP
        -- Get day of week (0=Sunday, 1=Monday, etc.)
        dow := EXTRACT(DOW FROM loop_date);
        
        -- Check if this date is a blocked holiday
        SELECT EXISTS (
            SELECT 1 
            FROM holidays h
            JOIN provider_holiday_preferences php ON h.id = php.holiday_id
            WHERE php.provider_id = p_provider
            AND h.date = loop_date
            AND php.blocks_availability = true
        ) INTO blocked_holiday;
        
        -- Skip this day if it's a blocked holiday
        IF blocked_holiday THEN
            loop_date := loop_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- Get availability for this day of week
        SELECT pa.start_time, pa.end_time, pa.buffer_mins
        INTO avail_record
        FROM provider_availability pa
        WHERE pa.provider_id = p_provider
        AND pa.day_of_week = dow;
        
        -- Skip if no availability for this day
        IF NOT FOUND THEN
            loop_date := loop_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- Calculate day boundaries with availability times
        day_start := loop_date + avail_record.start_time;
        day_end := loop_date + avail_record.end_time;
        buffer_mins := avail_record.buffer_mins;
        
        -- Skip if date range doesn't overlap with this day
        IF day_end <= p_from OR day_start >= p_to THEN
            loop_date := loop_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- Adjust boundaries to actual requested range
        IF day_start < p_from THEN
            day_start := p_from;
        END IF;
        IF day_end > p_to THEN
            day_end := p_to;
        END IF;
        
        -- Generate slots for this day
        slot_start := day_start;
        
        WHILE slot_start + (p_slot_mins || ' minutes')::interval <= day_end LOOP
            slot_end := slot_start + (p_slot_mins || ' minutes')::interval;
            
            -- Check if this slot conflicts with any unavailability
            IF NOT EXISTS (
                SELECT 1 FROM provider_unavailability pu
                WHERE pu.provider_id = p_provider
                AND pu.start_ts < slot_end
                AND pu.end_ts > slot_start
            ) AND NOT EXISTS (
                -- Check if this slot conflicts with any existing bookings
                SELECT 1 FROM provider_bookings pb
                WHERE pb.provider_id = p_provider
                AND pb.status != 'cancelled'
                AND pb.start_ts < slot_end
                AND pb.end_ts > slot_start
            ) THEN
                -- Return this available slot
                RETURN NEXT;
            END IF;
            
            -- Move to next slot (with buffer)
            slot_start := slot_start + ((p_slot_mins + buffer_mins) || ' minutes')::interval;
        END LOOP;
        
        loop_date := loop_date + INTERVAL '1 day';
    END LOOP;
END;
$$;

-- ==========================================
-- HOME PROFILES MANAGEMENT TRIGGERS & VIEWS
-- ==========================================

-- Function to populate user_tasks when a property is added
CREATE OR REPLACE FUNCTION public.populate_user_tasks_for_new_property()
RETURNS trigger AS $$
DECLARE
  homeowner_plan TEXT;
  m_row RECORD;
BEGIN
  -- 1) Find the homeowner's plan_name
  SELECT p2.name INTO homeowner_plan
  FROM public.plans p2
  JOIN public.user_plans up2 ON up2.plan_id = p2.id
  WHERE up2.user_id = NEW.user_id;

  -- If no plan found, default to Free
  IF homeowner_plan IS NULL THEN
    homeowner_plan := 'Free';
  END IF;

  -- 2) For each master_task matching this region & plan, insert into user_tasks
  FOR m_row IN
    SELECT id, default_offset_days
    FROM public.master_tasks
    WHERE region = NEW.region
      AND plan_name = homeowner_plan
  LOOP
    INSERT INTO public.user_tasks (
      user_id,
      property_id,
      task_id,
      due_date,
      created_at
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      m_row.id,
      (CURRENT_DATE + m_row.default_offset_days),
      now()
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicates if trigger runs multiple times
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-populating tasks
DROP TRIGGER IF EXISTS trg_populate_user_tasks ON public.properties;

CREATE TRIGGER trg_populate_user_tasks
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.populate_user_tasks_for_new_property();

-- View for user tasks with master task details
CREATE OR REPLACE VIEW public.view_user_tasks_with_details AS
SELECT
  ut.id,
  ut.user_id,
  ut.property_id,
  ut.task_id,
  ut.completed,
  ut.completed_at,
  ut.completed_by,  -- Added for DIY vs Professional tracking in Rivo Reports
  ut.due_date,
  ut.priority,
  ut.reminder_sent_1day,
  ut.reminder_sent_7day,
  ut.created_at,
  mt.name as title,
  mt.description,
  mt.region,
  mt.plan_name,
  p.address as property_address,
  p.property_type,
  p.year_built
FROM public.user_tasks ut
JOIN public.master_tasks mt ON mt.id = ut.task_id
JOIN public.properties p ON p.id = ut.property_id
WHERE ut.user_id = auth.uid()
ORDER BY ut.due_date ASC;

-- Grant access to the view
GRANT SELECT ON public.view_user_tasks_with_details TO authenticated;

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Extend user_plans to track Stripe IDs & subscription status
-- Note: These fields are optional and will be NULL until Stripe is configured
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Service Provider Search & Messaging System Tables

-- Table for provider messages/quote requests
CREATE TABLE IF NOT EXISTS public.provider_messages (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id   UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id    UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  subject        TEXT      NOT NULL,
  message        TEXT      NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at        TIMESTAMPTZ,
  archived_at    TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_messages_provider_id ON public.provider_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_messages_homeowner_id ON public.provider_messages(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_provider_messages_created_at ON public.provider_messages(created_at);

-- Search view for providers (includes only approved providers)
CREATE OR REPLACE VIEW public.view_providers_search AS
SELECT 
  pp.user_id,
  pp.business_name,
  pp.zip_code,
  pp.contact_name,
  pp.contact_email,
  pp.phone,
  pp.bio,
  pp.logo_url,
  pp.created_at,
  array_agg(psm.name ORDER BY psm.name) AS services_offered,
  array_agg(ps.radius_miles ORDER BY psm.name) AS service_radius
FROM public.provider_profiles pp
JOIN public.provider_services ps ON pp.user_id = ps.provider_id
JOIN public.provider_services_master psm ON ps.service_id = psm.id
WHERE pp.onboarding_status = 'approved'
GROUP BY pp.user_id, pp.business_name, pp.zip_code, pp.contact_name, 
         pp.contact_email, pp.phone, pp.bio, pp.logo_url, pp.created_at;

-- Search function for providers by ZIP and service
CREATE OR REPLACE FUNCTION public.search_providers(
  search_zip TEXT DEFAULT '',
  search_service TEXT DEFAULT ''
)
RETURNS TABLE (
  user_id UUID,
  business_name TEXT,
  zip_code TEXT,
  contact_name TEXT,
  contact_email TEXT,
  phone TEXT,
  bio TEXT,
  logo_url TEXT,
  services_offered TEXT[],
  service_radius INTEGER[],
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vps.user_id,
    vps.business_name,
    vps.zip_code,
    vps.contact_name,
    vps.contact_email,
    vps.phone,
    vps.bio,
    vps.logo_url,
    -- Filter services to only show the searched service if specified
    CASE 
      WHEN search_service = '' OR search_service IS NULL THEN vps.services_offered
      ELSE ARRAY[search_service]::TEXT[]
    END AS services_offered,
    -- Filter radius to match the searched service if specified
    CASE 
      WHEN search_service = '' OR search_service IS NULL THEN vps.service_radius
      ELSE ARRAY[(
        SELECT ps.radius_miles 
        FROM public.provider_services ps
        JOIN public.provider_services_master psm ON ps.service_id = psm.id
        WHERE ps.provider_id = vps.user_id 
        AND psm.name = search_service
        LIMIT 1
      )]::INTEGER[]
    END AS service_radius,
    vps.created_at
  FROM public.view_providers_search vps
  WHERE 
    (search_zip = '' OR search_zip IS NULL OR vps.zip_code = search_zip)
    AND (search_service = '' OR search_service IS NULL OR search_service = ANY(vps.services_offered))
  ORDER BY vps.business_name;
END;
$$;

-- ==========================================
-- RIVO REPORT SCHEMA ADDITIONS
-- ==========================================

-- Enhanced properties table columns
-- Note: These are added via ALTER TABLE in migration
-- square_footage INT
-- purchase_date DATE
-- rivo_id TEXT UNIQUE
-- nickname TEXT

-- User task history table for verification tracking
CREATE TABLE IF NOT EXISTS public.user_task_history (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id      UUID      REFERENCES public.properties(id) ON DELETE CASCADE,
  task_type        TEXT      NOT NULL,
  task_date        DATE      NOT NULL,
  source           TEXT      NOT NULL CHECK (source IN ('verified_pro', 'verified_external', 'diy_upload', 'self_reported')),
  verification_level NUMERIC(3,2) NOT NULL CHECK (verification_level BETWEEN 0 AND 1),
  notes            TEXT,
  media_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property owners table for ownership timeline
CREATE TABLE IF NOT EXISTS public.property_owners (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID      REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_name    TEXT      NOT NULL,
  owner_email   TEXT,
  start_date    DATE      NOT NULL,
  end_date      DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_task_history_user_id ON public.user_task_history(user_id);
CREATE INDEX idx_user_task_history_property_id ON public.user_task_history(property_id);
CREATE INDEX idx_user_task_history_task_date ON public.user_task_history(task_date);
CREATE INDEX idx_property_owners_property_id ON public.property_owners(property_id);
CREATE INDEX idx_property_owners_dates ON public.property_owners(start_date, end_date);

-- Enable RLS on new tables
ALTER TABLE public.user_task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_task_history
CREATE POLICY "Users can view their own task history"
  ON public.user_task_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own task history"
  ON public.user_task_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task history"
  ON public.user_task_history FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own task history"
  ON public.user_task_history FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for property_owners
CREATE POLICY "Users can view owners of their properties"
  ON public.property_owners FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage owners of their properties"
  ON public.property_owners FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );

-- Function to generate Rivo ID
CREATE OR REPLACE FUNCTION public.generate_rivo_id(p_region TEXT, p_address TEXT)
RETURNS TEXT AS $$
DECLARE
  state_code TEXT;
  zip_code   TEXT;
  random_part TEXT;
  new_rivo_id TEXT;
  counter INT := 0;
BEGIN
  -- Extract state from region (assuming format like "Dallas, TX")
  state_code := UPPER(COALESCE(
    SUBSTRING(p_region FROM ', ([A-Z]{2})$'),
    'XX'
  ));
  
  -- Extract ZIP from address using regex
  zip_code := COALESCE(
    SUBSTRING(p_address FROM '\d{5}'),
    '00000'
  );
  
  -- Generate unique Rivo ID with collision handling
  LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || counter::TEXT) FROM 1 FOR 4));
    new_rivo_id := CONCAT('RIV-', state_code, '-', zip_code, '-', random_part);
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE rivo_id = new_rivo_id) THEN
      RETURN new_rivo_id;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 1000 THEN
      RAISE EXCEPTION 'Unable to generate unique Rivo ID';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set Rivo ID
CREATE OR REPLACE FUNCTION public.set_rivo_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rivo_id IS NULL THEN
    NEW.rivo_id := public.generate_rivo_id(NEW.region, NEW.address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate Rivo ID
DROP TRIGGER IF EXISTS trg_generate_rivo_id ON public.properties;
CREATE TRIGGER trg_generate_rivo_id
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_rivo_id();

-- Function to calculate Home Health Score
CREATE OR REPLACE FUNCTION public.calculate_home_health_score(p_property_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points NUMERIC := 0;
  total_possible NUMERIC := 0;
  task_record RECORD;
  overdue_count INTEGER;
BEGIN
  -- Count tasks by verification level
  FOR task_record IN 
    SELECT 
      source,
      COUNT(*) as count,
      CASE source
        WHEN 'verified_pro' THEN 1.0
        WHEN 'verified_external' THEN 0.85
        WHEN 'diy_upload' THEN 0.9
        WHEN 'self_reported' THEN 0.6
      END as weight
    FROM public.user_task_history
    WHERE property_id = p_property_id
      AND task_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY source
  LOOP
    total_points := total_points + (task_record.count * task_record.weight);
    total_possible := total_possible + task_record.count;
  END LOOP;
  
  -- Count overdue tasks (weight = 0)
  SELECT COUNT(*) INTO overdue_count
  FROM public.user_tasks ut
  WHERE ut.property_id = p_property_id
    AND ut.due_date < CURRENT_DATE
    AND ut.completed = false;
  
  IF overdue_count > 0 THEN
    total_possible := total_possible + overdue_count;
  END IF;
  
  -- Calculate score
  IF total_possible = 0 THEN
    RETURN 100; -- No tasks = perfect score
  ELSE
    RETURN ROUND((total_points / total_possible) * 100);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property report data
CREATE OR REPLACE FUNCTION public.get_property_report_data(p_property_id UUID)
RETURNS TABLE (
  verification_source TEXT,
  task_count INTEGER,
  weight NUMERIC,
  contribution INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH task_counts AS (
    -- Completed tasks from history
    SELECT 
      source,
      COUNT(*)::INTEGER as count
    FROM public.user_task_history
    WHERE property_id = p_property_id
      AND task_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY source
    
    UNION ALL
    
    -- Overdue tasks
    SELECT 
      'overdue' as source,
      COUNT(*)::INTEGER as count
    FROM public.user_tasks ut
    WHERE ut.property_id = p_property_id
      AND ut.due_date < CURRENT_DATE
      AND ut.completed = false
  )
  SELECT 
    tc.source as verification_source,
    tc.count as task_count,
    CASE tc.source
      WHEN 'verified_pro' THEN 1.0
      WHEN 'verified_external' THEN 0.85
      WHEN 'diy_upload' THEN 0.9
      WHEN 'self_reported' THEN 0.6
      WHEN 'overdue' THEN 0.0
    END as weight,
    ROUND(tc.count * CASE tc.source
      WHEN 'verified_pro' THEN 1.0
      WHEN 'verified_external' THEN 0.85
      WHEN 'diy_upload' THEN 0.9
      WHEN 'self_reported' THEN 0.6
      WHEN 'overdue' THEN 0.0
    END * 100)::INTEGER as contribution
  FROM task_counts tc
  ORDER BY 
    CASE tc.source
      WHEN 'verified_pro' THEN 1
      WHEN 'verified_external' THEN 2
      WHEN 'diy_upload' THEN 3
      WHEN 'self_reported' THEN 4
      WHEN 'overdue' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create initial property owner
CREATE OR REPLACE FUNCTION public.create_initial_property_owner()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Get user details
  SELECT 
    COALESCE(p.full_name, u.email),
    u.email
  INTO user_name, user_email
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = NEW.user_id;
  
  -- Insert initial owner record
  INSERT INTO public.property_owners (
    property_id,
    owner_name,
    owner_email,
    start_date,
    notes
  ) VALUES (
    NEW.id,
    user_name,
    user_email,
    COALESCE(NEW.purchase_date, CURRENT_DATE),
    'Report Initiator'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_initial_owner ON public.properties;
CREATE TRIGGER trg_create_initial_owner
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_property_owner();

-- Summary view for property reports
CREATE OR REPLACE VIEW public.view_property_report_summary AS
SELECT 
  p.id as property_id,
  p.address,
  p.rivo_id,
  p.property_type,
  p.square_footage,
  p.purchase_date,
  p.region,
  p.year_built,
  public.calculate_home_health_score(p.id) as home_health_score,
  (
    SELECT COUNT(*)
    FROM public.user_tasks ut
    WHERE ut.property_id = p.id
      AND ut.due_date >= CURRENT_DATE
      AND ut.completed = false
  ) as upcoming_tasks_count,
  (
    SELECT COUNT(*)
    FROM public.user_tasks ut
    WHERE ut.property_id = p.id
      AND ut.due_date < CURRENT_DATE
      AND ut.completed = false
  ) as overdue_tasks_count,
  (
    SELECT json_agg(
      json_build_object(
        'owner_name', po.owner_name,
        'start_date', po.start_date,
        'end_date', po.end_date,
        'notes', po.notes
      ) ORDER BY po.start_date
    )
    FROM public.property_owners po
    WHERE po.property_id = p.id
  ) as owners
FROM public.properties p
WHERE p.user_id = auth.uid();

-- Grant permissions
GRANT SELECT ON public.user_task_history TO authenticated;
GRANT INSERT ON public.user_task_history TO authenticated;
GRANT UPDATE ON public.user_task_history TO authenticated;
GRANT DELETE ON public.user_task_history TO authenticated;

GRANT SELECT ON public.property_owners TO authenticated;
GRANT INSERT ON public.property_owners TO authenticated;
GRANT UPDATE ON public.property_owners TO authenticated;
GRANT DELETE ON public.property_owners TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_home_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_report_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_rivo_id(TEXT, TEXT) TO authenticated;

GRANT SELECT ON public.view_property_report_summary TO authenticated;

-- ==========================================
-- SHARED REPORTS TABLE FOR SHAREABLE LINKS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shared_reports (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID      REFERENCES public.properties(id) ON DELETE CASCADE,
  token           TEXT      UNIQUE NOT NULL,       -- random, e.g. a 32-char hex string
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

-- RLS: anyone (even anon) can SELECT on shared_reports (we check token manually)
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select by anyone"
  ON public.shared_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow insert by homeowner"
  ON public.shared_reports FOR INSERT
  USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  )
  WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- No UPDATE/DELETE by clients—only via service_role or admin

-- ==========================================
-- SUPPORT TICKETS TABLE FOR PRIORITY SUPPORT
-- ==========================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  subject       TEXT      NOT NULL,
  description   TEXT      NOT NULL,
  priority      TEXT      NOT NULL DEFAULT 'normal', -- 'normal' or 'high'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT      NOT NULL DEFAULT 'open'     -- 'open', 'closed'
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can insert own ticket" ON public.support_tickets FOR INSERT
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "User can manage own ticket" ON public.support_tickets FOR SELECT, UPDATE, DELETE
  USING ( user_id = auth.uid() );

-- ==========================================
-- FEATURE FLAGS TABLE FOR BETA FEATURES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT      NOT NULL UNIQUE,
  description   TEXT      NOT NULL,
  enabled       BOOLEAN   NOT NULL DEFAULT false,
  beta_only     BOOLEAN   NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for feature flags - everyone can read, admin can manage
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Seed some example beta features
INSERT INTO public.feature_flags (name, description, enabled, beta_only) VALUES
  ('advanced_analytics', 'Advanced property analytics and insights dashboard', true, true),
  ('ai_maintenance_suggestions', 'AI-powered maintenance task suggestions based on property data', true, true),
  ('virtual_property_tours', 'Create and share virtual property tours', false, true),
  ('smart_home_integration', 'Connect with smart home devices and IoT sensors', true, true),
  ('automated_reporting', 'Automated property report generation and scheduling', true, true)
ON CONFLICT (name) DO NOTHING;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION public.user_has_feature_access(
  user_uuid UUID,
  feature_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  feature_record RECORD;
  user_plan RECORD;
BEGIN
  -- Get feature details
  SELECT enabled, beta_only INTO feature_record
  FROM public.feature_flags
  WHERE name = feature_name;
  
  -- If feature doesn't exist or is disabled, return false
  IF feature_record IS NULL OR NOT feature_record.enabled THEN
    RETURN false;
  END IF;
  
  -- If it's not a beta feature, everyone has access
  IF NOT feature_record.beta_only THEN
    RETURN true;
  END IF;
  
  -- For beta features, check if user has Premium plan
  SELECT p.max_homes INTO user_plan
  FROM public.user_plans up
  JOIN public.plans p ON up.plan_id = p.id
  WHERE up.user_id = user_uuid;
  
  -- Premium users have max_homes = NULL, they get beta access
  RETURN user_plan.max_homes IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_feature_access(UUID, TEXT) TO authenticated;

-- Grant permissions on feature_flags table
GRANT SELECT ON public.feature_flags TO authenticated;

-- ==========================================
-- FOUNDING PROVIDER FEATURES
-- ==========================================

-- 1. ADD FOUNDING PROVIDER COLUMNS TO PROVIDER_PROFILES
-- Add is_founding_provider, avg_rating, and review_count columns
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS is_founding_provider BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avg_rating   NUMERIC(3,2)  DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INT             DEFAULT 0;

-- 2. LEADS TABLE FOR PRIORITY QUEUEING
CREATE TABLE IF NOT EXISTS public.leads (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id   UUID      REFERENCES auth.users(id)  ON DELETE CASCADE,
  provider_id    UUID      REFERENCES auth.users(id), -- assigned provider (nullable until distribution)
  zip_code       TEXT      NOT NULL,
  service_type   TEXT      NOT NULL,
  status         TEXT      NOT NULL DEFAULT 'unassigned',  -- 'unassigned' | 'assigned' | 'closed'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ
);

-- RLS policies for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Homeowners can create new leads (INSERT) for themselves
CREATE POLICY "Homeowner can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK ( homeowner_id = auth.uid() );

-- Homeowners can SELECT or DELETE their own leads
CREATE POLICY "Homeowner can manage own leads"
  ON public.leads FOR SELECT, DELETE
  USING ( homeowner_id = auth.uid() );

-- Providers can SELECT leads once assigned to them
CREATE POLICY "Provider can select assigned leads"
  ON public.leads FOR SELECT
  USING ( provider_id = auth.uid() );

-- Providers can UPDATE a lead's status to 'closed' after they work it
CREATE POLICY "Provider can update own leads"
  ON public.leads FOR UPDATE
  USING ( provider_id = auth.uid() )
  WITH CHECK ( provider_id = auth.uid() );

-- Admin (service_role) can bypass to assign leads
CREATE POLICY "service_role assign leads"
  ON public.leads FOR UPDATE, SELECT, DELETE
  TO service_role
  USING ( true ) 
  WITH CHECK ( true );

-- Index to speed up lead queries
CREATE INDEX IF NOT EXISTS idx_leads_status_created
  ON public.leads (status, created_at);

-- 3. REVIEWS & RATINGS SYSTEM
CREATE TABLE IF NOT EXISTS public.reviews (
  id             INT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  subject_id     UUID      REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id    UUID      REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id     UUID      REFERENCES public.provider_bookings(id) ON DELETE CASCADE,
  rating         INT       NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_id)
);

-- RLS policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Homeowner can insert a review only after their booking is completed
CREATE POLICY "Homeowner can insert own review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.provider_bookings b
      WHERE b.id = booking_id
        AND b.homeowner_id = auth.uid()
        AND b.provider_id = subject_id
        AND b.status = 'completed'
    )
  );

-- Homeowner can SELECT their own reviews
CREATE POLICY "Homeowner can select own reviews"
  ON public.reviews FOR SELECT
  USING ( reviewer_id = auth.uid() );

-- Provider can SELECT reviews of them
CREATE POLICY "Provider can select own reviews"
  ON public.reviews FOR SELECT
  USING ( subject_id = auth.uid() );

-- Admin (service_role) can SELECT, UPDATE, DELETE for moderation
CREATE POLICY "service_role manage reviews"
  ON public.reviews FOR ALL TO service_role
  USING ( true )
  WITH CHECK ( true );

-- 4. DISCOUNT CODES SYSTEM
CREATE TABLE IF NOT EXISTS public.discount_codes (
  code            TEXT       PRIMARY KEY,   -- e.g. 'FOUND99OFF'
  percent_off     INT        NOT NULL CHECK (percent_off >= 1 AND percent_off <= 100),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_by      UUID       REFERENCES auth.users(id) ON DELETE CASCADE,  -- provider who created
  usage_limit     INT        NOT NULL DEFAULT 1,  -- how many times total it can be used
  usage_count     INT        NOT NULL DEFAULT 0   -- increments each time redeemed
);

-- RLS policies for discount codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Only Founding providers can insert codes
CREATE POLICY "Founding provider can create codes"
  ON public.discount_codes FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles p
      WHERE p.user_id = auth.uid() AND p.is_founding_provider = TRUE
    )
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Providers can SELECT and UPDATE usage_count for codes they created
CREATE POLICY "Provider can select own codes"
  ON public.discount_codes FOR SELECT
  USING ( created_by = auth.uid() );

CREATE POLICY "Provider can update own codes"
  ON public.discount_codes FOR UPDATE
  USING ( created_by = auth.uid() )
  WITH CHECK ( created_by = auth.uid() );

-- Homeowners can SELECT codes (to validate before booking), but NOT insert/update/delete
CREATE POLICY "Homeowner can select codes"
  ON public.discount_codes FOR SELECT
  USING ( true );

-- 5. FUNCTIONS FOR FOUNDING PROVIDER FEATURES

-- Function to refresh provider ratings after new review
CREATE OR REPLACE FUNCTION public.refresh_provider_rating(p_provider_id UUID)
RETURNS TABLE (avg_rating NUMERIC(3,2), review_count INT) AS $$
DECLARE
  _avg NUMERIC(3,2);
  _count INT;
BEGIN
  SELECT ROUND(AVG(r.rating)::numeric, 2), COUNT(*)
  INTO _avg, _count
  FROM public.reviews r
  WHERE r.subject_id = p_provider_id;

  IF _count IS NULL OR _count = 0 THEN
    _avg := 0.00;
    _count := 0;
  END IF;

  UPDATE public.provider_profiles
  SET avg_rating = _avg, review_count = _count
  WHERE user_id = p_provider_id;

  RETURN QUERY SELECT _avg, _count;
END;
$$ LANGUAGE plpgsql;

-- Function to distribute daily leads based on provider tier
CREATE OR REPLACE FUNCTION public.distribute_daily_leads()
RETURNS VOID AS $$
DECLARE
  current_lead RECORD;
  eligible_provider RECORD;
  lead_cursor CURSOR FOR
    SELECT * FROM public.leads
    WHERE status = 'unassigned'
    ORDER BY created_at ASC;
  
  -- Cursors to find providers by tier
  founding_cursor CURSOR FOR
    SELECT u.id AS provider_id
    FROM public.provider_profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.is_founding_provider = TRUE
    ORDER BY p.user_id; -- static order or randomize
  
  core_cursor CURSOR FOR
    SELECT up.user_id AS provider_id
    FROM public.user_plans up
    JOIN public.plans pl ON pl.id = up.plan_id
    WHERE pl.name = 'Core'
    ORDER BY up.user_id;
  
  other_cursor CURSOR FOR
    SELECT up.user_id AS provider_id
    FROM public.user_plans up
    JOIN public.plans pl ON pl.id = up.plan_id
    WHERE pl.name NOT IN ('Core', 'Founding')
    ORDER BY up.user_id;
  
  assigned_count INT;
  max_per_provider INT;
BEGIN
  -- 1) Define max leads per provider: Founding → 10, Core → 5, Others → 2
  FOR current_lead IN lead_cursor LOOP
    -- 2) Try Founding providers first
    max_per_provider := 10;
    OPEN founding_cursor;
    LOOP
      FETCH founding_cursor INTO eligible_provider;
      EXIT WHEN NOT FOUND;
      SELECT COUNT(*) INTO assigned_count
      FROM public.leads
      WHERE provider_id = eligible_provider.provider_id
        AND assigned_at >= date_trunc('day', now());
      IF assigned_count < max_per_provider THEN
        -- Assign this lead to that provider
        UPDATE public.leads
        SET provider_id = eligible_provider.provider_id,
            status = 'assigned',
            assigned_at = now()
        WHERE id = current_lead.id;
        CLOSE founding_cursor;
        RAISE NOTICE 'Assigned lead % to founding provider %', current_lead.id, eligible_provider.provider_id;
        EXIT; -- move to next lead
      END IF;
    END LOOP;
    CLOSE founding_cursor;
    IF current_lead.provider_id IS NOT NULL THEN
      CONTINUE; -- already assigned
    END IF;

    -- 3) Try Core providers next
    max_per_provider := 5;
    OPEN core_cursor;
    LOOP
      FETCH core_cursor INTO eligible_provider;
      EXIT WHEN NOT FOUND;
      SELECT COUNT(*) INTO assigned_count
      FROM public.leads
      WHERE provider_id = eligible_provider.provider_id
        AND assigned_at >= date_trunc('day', now());
      IF assigned_count < max_per_provider THEN
        -- Assign this lead to that provider
        UPDATE public.leads
        SET provider_id = eligible_provider.provider_id,
            status = 'assigned',
            assigned_at = now()
        WHERE id = current_lead.id;
        CLOSE core_cursor;
        RAISE NOTICE 'Assigned lead % to core provider %', current_lead.id, eligible_provider.provider_id;
        EXIT; -- move to next lead
      END IF;
    END LOOP;
    CLOSE core_cursor;
    IF current_lead.provider_id IS NOT NULL THEN
      CONTINUE; -- already assigned
    END IF;

    -- 4) Try other providers
    max_per_provider := 2;
    OPEN other_cursor;
    LOOP
      FETCH other_cursor INTO eligible_provider;
      EXIT WHEN NOT FOUND;
      SELECT COUNT(*) INTO assigned_count
      FROM public.leads
      WHERE provider_id = eligible_provider.provider_id
        AND assigned_at >= date_trunc('day', now());
      IF assigned_count < max_per_provider THEN
        -- Assign this lead to that provider
        UPDATE public.leads
        SET provider_id = eligible_provider.provider_id,
            status = 'assigned',
            assigned_at = now()
        WHERE id = current_lead.id;
        CLOSE other_cursor;
        RAISE NOTICE 'Assigned lead % to other provider %', current_lead.id, eligible_provider.provider_id;
        EXIT; -- move to next lead
      END IF;
    END LOOP;
    CLOSE other_cursor;
    IF current_lead.provider_id IS NOT NULL THEN
      CONTINUE; -- already assigned
    END IF;
  END LOOP;
END;
$$;

-- ==========================================
-- SYSTEM-WIDE ADMIN ENHANCEMENTS
-- ==========================================
-- Added: User suspension capability
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Added: Enhanced subscription management
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Added: User wallet system for credits
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added: Provider applications workflow
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

-- Added: Comprehensive audit logging system
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

-- Added: Audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit() 
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  record_id_value TEXT;
BEGIN
  -- Get the logged-in user from custom setting or current auth context
  BEGIN
    user_id := current_setting('audit.logged_in_user', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      user_id := auth.uid();
  END;

  -- Determine the record ID based on the table structure
  IF (TG_OP = 'INSERT') THEN
    -- Try different primary key field names
    IF TG_TABLE_NAME = 'user_plans' THEN
      record_id_value := NEW.user_id::TEXT;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      record_id_value := NEW.id::TEXT;
    ELSE
      -- Default to trying 'id' field, with fallback
      BEGIN
        record_id_value := (to_jsonb(NEW)->>'id')::TEXT;
      EXCEPTION
        WHEN OTHERS THEN
          record_id_value := 'unknown';
      END;
    END IF;
    
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, record_id_value, user_id, to_jsonb(NEW));
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Try different primary key field names
    IF TG_TABLE_NAME = 'user_plans' THEN
      record_id_value := OLD.user_id::TEXT;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      record_id_value := OLD.id::TEXT;
    ELSE
      -- Default to trying 'id' field, with fallback
      BEGIN
        record_id_value := (to_jsonb(OLD)->>'id')::TEXT;
      EXCEPTION
        WHEN OTHERS THEN
          record_id_value := 'unknown';
      END;
    END IF;
    
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, record_id_value, user_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE') THEN
    -- Try different primary key field names
    IF TG_TABLE_NAME = 'user_plans' THEN
      record_id_value := OLD.user_id::TEXT;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      record_id_value := OLD.id::TEXT;
    ELSE
      -- Default to trying 'id' field, with fallback
      BEGIN
        record_id_value := (to_jsonb(OLD)->>'id')::TEXT;
      EXCEPTION
        WHEN OTHERS THEN
          record_id_value := 'unknown';
      END;
    END IF;
    
    INSERT INTO public.audit_logs(table_name, operation, record_id, changed_by, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, record_id_value, user_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Added: Admin utility functions
CREATE OR REPLACE FUNCTION public.set_audit_context(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('audit.logged_in_user', user_uuid::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_suspended(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND is_suspended = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Added: Usage tracking views
CREATE OR REPLACE VIEW public.view_user_home_counts AS
SELECT
  user_id,
  COUNT(*) AS home_count
FROM public.properties
GROUP BY user_id;

CREATE OR REPLACE VIEW public.view_user_tasks_completed AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE completed = TRUE) AS tasks_completed
FROM public.user_tasks
GROUP BY user_id;

CREATE OR REPLACE VIEW public.view_daily_new_signups AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS signup_count
FROM auth.users
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.view_active_subscribers AS
SELECT
  COUNT(*) AS active_count
FROM public.user_plans
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW public.view_daily_tasks_completed AS
SELECT
  date_trunc('day', completed_at) AS day,
  COUNT(*) AS completed_count
FROM public.user_tasks
WHERE completed = TRUE
  AND completed_at >= now() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- Added: Table comments
COMMENT ON TABLE public.user_wallets IS 'User wallet balances for credit system';
  COMMENT ON TABLE public.provider_applications IS 'Provider application submissions for admin review';
  COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all critical operations';

-- ==========================================
-- EARNINGS SUMMARY VIEW
-- ==========================================

-- Provider earnings summary by time periods
CREATE OR REPLACE VIEW public.view_provider_earnings_summary AS
SELECT
  -- This Week (last 7 days)
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND e.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
   AND e.status = 'paid') as this_week_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND e.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
   AND e.status = 'paid') as this_week_jobs,
  
  -- This Month
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(MONTH FROM e.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as this_month_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(MONTH FROM e.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as this_month_jobs,
  
  -- Year to Date
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as year_to_date_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as year_to_date_jobs;

-- ==========================================
-- EARNINGS SUMMARY VIEW
-- ==========================================

-- Provider earnings summary by time periods
CREATE OR REPLACE VIEW public.view_provider_earnings_summary AS
SELECT
  -- This Week (last 7 days)
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND e.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
   AND e.status = 'paid') as this_week_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND e.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
   AND e.status = 'paid') as this_week_jobs,
  
  -- This Month
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(MONTH FROM e.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as this_month_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(MONTH FROM e.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as this_month_jobs,
  
  -- Year to Date
  (SELECT COALESCE(SUM(e.amount), 0) 
   FROM public.earnings e 
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as year_to_date_amount,
  
  (SELECT COUNT(*) 
   FROM public.earnings e 
   JOIN public.jobs j ON e.job_id = j.id
   WHERE e.provider_id = auth.uid() 
   AND EXTRACT(YEAR FROM e.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   AND e.status = 'paid') as year_to_date_jobs;

-- ==========================================
-- REPORT DOWNLOADS TRACKING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.report_downloads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  stripe_session_id  TEXT,
  paid_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_id         TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own downloads
CREATE POLICY "Users can view their own downloads"
  ON public.report_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert their own downloads"
  ON public.report_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_report_downloads_user_id ON public.report_downloads(user_id);
CREATE INDEX idx_report_downloads_property_id ON public.report_downloads(property_id);

-- ==========================================
-- PROVIDER DOCUMENTS TABLE
-- ==========================================
-- Table to store provider document metadata (licenses, insurance, logos, other docs)
-- Note: The 'logo' document type is used for provider profile images/logos.
-- When a logo is uploaded, the public URL is automatically saved to provider_profiles.logo_url
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('license', 'insurance', 'other', 'logo')),
  file_path TEXT NOT NULL,
  file_name TEXT,
  license_number TEXT,
  issuing_state TEXT,
  document_title TEXT, -- For "other" documents to have a custom title
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on provider_documents
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_documents
CREATE POLICY "Providers can view their own documents"
  ON public.provider_documents FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own documents"
  ON public.provider_documents FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their own documents"
  ON public.provider_documents FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can delete their own documents"
  ON public.provider_documents FOR DELETE
  USING (provider_id = auth.uid());

-- Admins can view all provider documents
CREATE POLICY "Admins can view all provider documents"
  ON public.provider_documents FOR SELECT
  USING (public.is_user_admin());

-- Trigger for provider_documents updated_at
CREATE TRIGGER provider_documents_updated_at
  BEFORE UPDATE ON public.provider_documents
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON public.provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_doc_type ON public.provider_documents(doc_type);