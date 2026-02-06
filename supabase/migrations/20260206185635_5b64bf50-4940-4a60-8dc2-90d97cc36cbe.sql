-- Allow business owners to manage reservations for their business
CREATE POLICY "Business owners can manage their reservations"
  ON public.marina_reservations
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE owner_id = auth.uid()
    )
  );