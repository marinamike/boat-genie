CREATE POLICY "Authenticated users can browse active service menu items"
ON public.business_service_menu FOR SELECT TO authenticated
USING (is_active = true);