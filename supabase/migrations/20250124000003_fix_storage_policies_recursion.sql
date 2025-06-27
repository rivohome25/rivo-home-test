-- Fix storage policies recursion issue
-- This migration removes problematic policies that caused infinite recursion
-- and replaces them with simple owner-based policies

-- Drop all potentially problematic policies on storage.objects
DROP POLICY IF EXISTS "provider_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_admin" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_select_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_update_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "provider_documents_simple_insert" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_manage_all_provider_documents" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_policy" ON storage.objects;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

-- Create simple owner-based policies for provider-documents bucket
-- Allow authenticated users to insert their own files
CREATE POLICY "provider_documents_insert_simple" 
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-documents' AND 
    owner = auth.uid()
  );

-- Allow authenticated users to select their own files
CREATE POLICY "provider_documents_select_simple" 
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-documents' AND 
    owner = auth.uid()
  );

-- Allow authenticated users to update their own files
CREATE POLICY "provider_documents_update_simple" 
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'provider-documents' AND 
    owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'provider-documents' AND 
    owner = auth.uid()
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "provider_documents_delete_simple" 
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-documents' AND 
    owner = auth.uid()
  );

-- Create service role policy for provider-documents bucket
CREATE POLICY "service_role_provider_documents" 
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'provider-documents')
  WITH CHECK (bucket_id = 'provider-documents'); 