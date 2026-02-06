-- Add policy for platform admin to view all businesses
CREATE POLICY "Platform admin can view all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());