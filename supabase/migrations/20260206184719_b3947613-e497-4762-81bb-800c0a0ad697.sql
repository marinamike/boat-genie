-- Allow any authenticated user to see businesses that accept reservations (for marina discovery)
CREATE POLICY "Customers can view businesses accepting reservations"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    enabled_modules @> ARRAY['slips']::business_module[]
    AND (accepts_transient = true OR accepts_longterm = true)
  );