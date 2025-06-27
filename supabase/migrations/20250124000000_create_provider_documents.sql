-- Create provider_documents table to store provider document metadata
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('license', 'insurance', 'other')),
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