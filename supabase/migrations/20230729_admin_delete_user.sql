-- Create a function to allow deleting users with admin privileges
-- This function should only be callable with service_role key
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Safely convert the input to UUID
  BEGIN
    user_uuid := user_id::UUID;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid UUID format: %', user_id;
  END;

  -- First delete related user data that might block deletion due to foreign keys
  DELETE FROM auth.sessions WHERE auth.sessions.user_id = user_uuid;
  DELETE FROM auth.refresh_tokens WHERE auth.refresh_tokens.user_id = user_uuid;
  DELETE FROM auth.identities WHERE auth.identities.user_id = user_uuid;
  
  -- Delete data from public tables referencing this user
  -- Use cascade for profiles to handle other dependent tables
  DELETE FROM public.profiles WHERE id = user_uuid;
  
  -- Finally delete the user
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$;

-- Revoke access from public
REVOKE EXECUTE ON FUNCTION public.admin_delete_user FROM PUBLIC;

-- Grant access only to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO service_role; 