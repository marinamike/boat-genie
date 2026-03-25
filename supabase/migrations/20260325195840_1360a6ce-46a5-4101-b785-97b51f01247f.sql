-- Create new bucket with same settings as provider-documents
INSERT INTO storage.buckets (id, name, public) VALUES ('business-documents', 'business-documents', false);

-- Move all objects to new bucket
UPDATE storage.objects SET bucket_id = 'business-documents' WHERE bucket_id = 'provider-documents';

-- RLS policies for new bucket
CREATE POLICY "business_docs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-documents');
CREATE POLICY "business_docs_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'business-documents');
CREATE POLICY "business_docs_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-documents');
CREATE POLICY "business_docs_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-documents');