-- Fix infinite recursion in profiles RLS policies

-- First drop all existing policies on profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END;
$$;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- 1. Users can read all profiles (public data)
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (TRUE);  -- Allow reading all profiles

-- 2. Users can only update their own profile
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- 3. Users can only insert their own profile
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 4. Users can delete their own profile
CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- 5. Admin bypass is defined without using self-referential checks
-- This avoids the infinite recursion by not querying the profiles table itself
-- to determine if the user is an admin
CREATE POLICY "admin_bypass_profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );
