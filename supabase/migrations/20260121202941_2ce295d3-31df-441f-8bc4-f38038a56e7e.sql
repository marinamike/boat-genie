-- Create vessel_documents table for Digital Vault
CREATE TABLE public.vessel_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('manuals', 'warranty', 'documentation')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  expiry_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_vessel_documents_boat_id ON public.vessel_documents(boat_id);
CREATE INDEX idx_vessel_documents_owner_id ON public.vessel_documents(owner_id);
CREATE INDEX idx_vessel_documents_category ON public.vessel_documents(category);

-- Enable RLS
ALTER TABLE public.vessel_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owners can view their vessel documents"
  ON public.vessel_documents
  FOR SELECT
  USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "Owners can create vessel documents"
  ON public.vessel_documents
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their vessel documents"
  ON public.vessel_documents
  FOR UPDATE
  USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "Owners can delete their vessel documents"
  ON public.vessel_documents
  FOR DELETE
  USING (owner_id = auth.uid() OR is_admin());

-- Create storage bucket for vessel documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vessel-documents',
  'vessel-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for vessel-documents bucket
CREATE POLICY "Owners can view their vessel document files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vessel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can upload vessel document files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'vessel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update vessel document files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'vessel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete vessel document files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'vessel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update trigger for updated_at
CREATE TRIGGER update_vessel_documents_updated_at
  BEFORE UPDATE ON public.vessel_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();