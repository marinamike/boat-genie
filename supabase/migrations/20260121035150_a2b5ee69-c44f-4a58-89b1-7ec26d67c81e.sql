-- Add new columns to provider_profiles for onboarding checklist
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
ADD COLUMN IF NOT EXISTS w9_doc_url TEXT,
ADD COLUMN IF NOT EXISTS ein TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending_setup',
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for provider-documents bucket
CREATE POLICY "Providers can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-documents' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
);

CREATE POLICY "Providers can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all provider documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-documents' 
  AND is_admin()
);