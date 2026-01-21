-- Create the vessel-vault storage bucket (replacing vessel-documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vessel-vault', 'vessel-vault', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for vessel-vault bucket
-- Only owners can upload to their own folder
CREATE POLICY "Owners can upload vessel documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vessel-vault' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only owners and admins can view their documents
CREATE POLICY "Owners and admins can view vessel documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vessel-vault' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- Only owners and admins can delete their documents
CREATE POLICY "Owners and admins can delete vessel documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vessel-vault' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- Update vessel_documents RLS to ensure providers cannot access
-- First drop existing policies and recreate with explicit provider exclusion
DROP POLICY IF EXISTS "Owners can view their vessel documents" ON public.vessel_documents;
DROP POLICY IF EXISTS "Owners can create vessel documents" ON public.vessel_documents;
DROP POLICY IF EXISTS "Owners can update their vessel documents" ON public.vessel_documents;
DROP POLICY IF EXISTS "Owners can delete their vessel documents" ON public.vessel_documents;

-- Recreate with explicit owner + admin only (no provider access)
CREATE POLICY "Owners can view their vessel documents" 
ON public.vessel_documents 
FOR SELECT 
USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can create vessel documents" 
ON public.vessel_documents 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their vessel documents" 
ON public.vessel_documents 
FOR UPDATE 
USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can delete their vessel documents" 
ON public.vessel_documents 
FOR DELETE 
USING (owner_id = auth.uid() OR public.is_admin());