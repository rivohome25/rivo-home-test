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