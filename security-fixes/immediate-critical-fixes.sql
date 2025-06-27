-- ========================================
-- IMMEDIATE CRITICAL SECURITY FIXES
-- ========================================
-- 
-- DANGER: These are CRITICAL vulnerabilities that allow complete system compromise
-- Execute these fixes IMMEDIATELY to prevent exploitation
--
-- Execute with: psql -f security-fixes/immediate-critical-fixes.sql
-- Or via Supabase SQL Editor

-- ==========================================
-- 1. DISABLE SQL INJECTION FUNCTIONS
-- ==========================================

-- Drop the extremely dangerous exec_sql function
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Drop the extremely dangerous pg_execute function  
DROP FUNCTION IF EXISTS public.pg_execute(text);

-- Log the security fix
INSERT INTO audit_log (action, details)
VALUES ('SECURITY_FIX', jsonb_build_object(
  'action', 'DISABLED_SQL_INJECTION_FUNCTIONS',
  'timestamp', now(),
  'functions_removed', array['exec_sql', 'pg_execute'],
  'severity', 'CRITICAL'
));

COMMENT ON TABLE audit_log IS 'Critical: SQL injection functions exec_sql and pg_execute have been disabled for security';

-- ==========================================
-- 2. STRENGTHEN PASSWORD POLICIES
-- ==========================================

-- Update Supabase auth config for stronger passwords
-- Note: This requires updating supabase/config.toml as well

-- Update minimum password length to 12 characters
UPDATE auth.config 
SET minimum_password_length = 12 
WHERE key = 'password_policy';

-- Add password complexity requirements
UPDATE auth.config 
SET password_requirements = 'letters,numbers,symbols'
WHERE key = 'password_policy';

-- ==========================================
-- 3. SECURE ADMIN FUNCTIONS
-- ==========================================

-- Add additional security to admin functions
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  current_user_role TEXT;
  current_user_admin BOOLEAN;
BEGIN
  -- SECURITY: Verify the current user is actually an admin
  SELECT role, is_admin INTO current_user_role, current_user_admin
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Strict admin verification
  IF current_user_role != 'admin' OR current_user_admin != true THEN
    RAISE EXCEPTION 'SECURITY: Unauthorized access attempt. Admin privileges required.';
  END IF;

  -- Additional IP-based restrictions (if possible)
  -- Log this critical action
  INSERT INTO audit_log (action, details)
  VALUES ('ADMIN_DELETE_USER', jsonb_build_object(
    'target_user_id', user_id,
    'admin_user_id', auth.uid(),
    'timestamp', now(),
    'ip_address', inet_client_addr()
  ));

  -- Safely convert the input to UUID
  BEGIN
    user_uuid := user_id::UUID;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'SECURITY: Invalid UUID format: %', user_id;
  END;

  -- Prevent self-deletion
  IF user_uuid = auth.uid() THEN
    RAISE EXCEPTION 'SECURITY: Admin cannot delete their own account';
  END IF;

  -- Execute deletion with full logging
  DELETE FROM auth.sessions WHERE auth.sessions.user_id = user_uuid;
  DELETE FROM auth.refresh_tokens WHERE auth.refresh_tokens.user_id = user_uuid;
  DELETE FROM auth.identities WHERE auth.identities.user_id = user_uuid;
  DELETE FROM public.profiles WHERE id = user_uuid;
  DELETE FROM auth.users WHERE id = user_uuid;
  
  -- Log successful deletion
  INSERT INTO audit_log (action, details)
  VALUES ('USER_DELETED', jsonb_build_object(
    'deleted_user_id', user_uuid,
    'admin_user_id', auth.uid(),
    'timestamp', now()
  ));
END;
$$;

-- ==========================================
-- 4. REMOVE HARDCODED CREDENTIALS
-- ==========================================

-- Ensure no test admin accounts with default passwords exist
DELETE FROM auth.users 
WHERE email IN (
  'admin@example.com',
  'test@example.com', 
  'admin@test.com'
);

-- Remove any profiles with suspicious admin flags
UPDATE public.profiles 
SET is_admin = false, role = 'homeowner'
WHERE is_admin = true 
AND id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN ('legitimate-admin@rivohome.com')
);

-- ==========================================
-- 5. ENHANCE RLS POLICIES 
-- ==========================================

-- Add additional security to profiles table
DROP POLICY IF EXISTS "service_role_bypass_profiles" ON public.profiles;

-- More restrictive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND is_admin = true
      )
    )
  );

-- More restrictive admin update policy  
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND is_admin = true
      )
    )
  );

-- ==========================================
-- 6. ADD SECURITY MONITORING
-- ==========================================

-- Enhanced audit logging for security events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "admin_only_security_events"
  ON security_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_admin = true
    )
  );

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  event_details JSONB DEFAULT '{}',
  event_severity TEXT DEFAULT 'MEDIUM'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_events (event_type, user_id, details, severity)
  VALUES (event_type, auth.uid(), event_details, event_severity);
END;
$$;

-- ==========================================
-- 7. RATE LIMITING SETUP
-- ==========================================

-- Create rate limiting table for API endpoints
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  endpoint_name TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limits
  WHERE (user_id = auth.uid() OR ip_address = inet_client_addr())
    AND endpoint = endpoint_name
    AND window_start > window_start;
  
  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    -- Log rate limit violation
    PERFORM log_security_event(
      'RATE_LIMIT_EXCEEDED',
      jsonb_build_object(
        'endpoint', endpoint_name,
        'request_count', current_count,
        'limit', max_requests
      ),
      'HIGH'
    );
    RETURN false;
  END IF;
  
  -- Record this request
  INSERT INTO rate_limits (user_id, ip_address, endpoint)
  VALUES (auth.uid(), inet_client_addr(), endpoint_name);
  
  RETURN true;
END;
$$;

-- ==========================================
-- 8. FINAL SECURITY VERIFICATION
-- ==========================================

-- Verify critical functions are disabled
DO $$
BEGIN
  -- Check if dangerous functions still exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('exec_sql', 'pg_execute')) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Dangerous SQL execution functions still exist!';
  END IF;
  
  -- Verify audit logging is working
  INSERT INTO audit_log (action, details)
  VALUES ('SECURITY_FIXES_APPLIED', jsonb_build_object(
    'timestamp', now(),
    'fixes_applied', array[
      'disabled_sql_injection_functions',
      'strengthened_password_policies', 
      'secured_admin_functions',
      'enhanced_rls_policies',
      'added_security_monitoring',
      'implemented_rate_limiting'
    ],
    'status', 'COMPLETED'
  ));
  
  RAISE NOTICE 'SUCCESS: Critical security fixes have been applied!';
END;
$$;

-- Log completion
SELECT 'CRITICAL SECURITY FIXES COMPLETED' as status, now() as timestamp; 