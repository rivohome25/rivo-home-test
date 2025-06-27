-- Clean up conflicting provider-documents storage policies
-- This migration consolidates the policies to avoid conflicts

-- Drop all existing provider-documents policies to start fresh
DROP POLICY IF EXISTS "provider_documents_select_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_update_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_simple_insert" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_manage_all_provider_documents" ON storage.objects;

-- Create consolidated policies that use both path-based and metadata-based checks
-- This ensures files can be accessed regardless of which approach is used

-- SELECT policy (using OR to allow either path or metadata access)
CREATE POLICY "provider_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-documents' AND (
      -- Path-based access
      ((storage.foldername(name))[1] = 'providers' AND 
       (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Metadata-based access
      (metadata->>'provider_id')::uuid = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "provider_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-documents' AND (
      -- Path-based validation
      ((storage.foldername(name))[1] = 'providers' AND 
       (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Metadata-based validation
      (metadata->>'provider_id')::uuid = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "provider_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'provider-documents' AND (
      -- Path-based access
      ((storage.foldername(name))[1] = 'providers' AND 
       (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Metadata-based access
      (metadata->>'provider_id')::uuid = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'provider-documents' AND (
      -- Path-based validation
      ((storage.foldername(name))[1] = 'providers' AND 
       (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Metadata-based validation
      (metadata->>'provider_id')::uuid = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "provider_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-documents' AND (
      -- Path-based access
      ((storage.foldername(name))[1] = 'providers' AND 
       (storage.foldername(name))[2] = auth.uid()::text)
      OR
      -- Metadata-based access
      (metadata->>'provider_id')::uuid = auth.uid()
    )
  );

-- Admin override policy
CREATE POLICY "provider_documents_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'provider-documents' AND
    public.is_user_admin()
  )
  WITH CHECK (
    bucket_id = 'provider-documents' AND
    public.is_user_admin()
  ); 