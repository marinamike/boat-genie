-- Ensure admins can read from provider-documents bucket
CREATE POLICY "Admins can read provider documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-documents' 
  AND public.is_admin()
);

-- Ensure admins can download provider documents
CREATE POLICY "Admins can download provider documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-documents' 
  AND public.is_admin()
);