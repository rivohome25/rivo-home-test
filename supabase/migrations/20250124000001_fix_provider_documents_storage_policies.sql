-- Fix storage policies for provider-documents bucket
-- This migration adds the missing RLS policies for the provider-documents storage bucket

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage SELECT policy for provider-documents (providers can view their own documents)
DROP POLICY IF EXISTS "provider_documents_select_own" ON storage.objects;
CREATE POLICY "provider_documents_select_own" ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'provider-documents' AND 
    (storage.foldername(name))[1] = 'providers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage INSERT policy for provider-documents (providers can upload their own documents)
DROP POLICY IF EXISTS "provider_documents_insert_own" ON storage.objects;
CREATE POLICY "provider_documents_insert_own" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket_id = 'provider-documents' AND 
    (storage.foldername(name))[1] = 'providers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage UPDATE policy for provider-documents (providers can update their own documents)
DROP POLICY IF EXISTS "provider_documents_update_own" ON storage.objects;
CREATE POLICY "provider_documents_update_own" ON storage.objects
  FOR UPDATE TO public
  USING (
    bucket_id = 'provider-documents' AND 
    (storage.foldername(name))[1] = 'providers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'provider-documents' AND 
    (storage.foldername(name))[1] = 'providers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage DELETE policy for provider-documents (providers can delete their own documents)
DROP POLICY IF EXISTS "provider_documents_delete_own" ON storage.objects;
CREATE POLICY "provider_documents_delete_own" ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'provider-documents' AND 
    (storage.foldername(name))[1] = 'providers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admin override policies for provider-documents storage
DROP POLICY IF EXISTS "admins_can_manage_all_provider_documents" ON storage.objects;
CREATE POLICY "admins_can_manage_all_provider_documents" ON storage.objects
  FOR ALL TO public
  USING (
    bucket_id = 'provider-documents' AND
    public.is_user_admin()
  )
  WITH CHECK (
    bucket_id = 'provider-documents' AND
    public.is_user_admin()
  ); 