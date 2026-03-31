DROP POLICY "Requesters and providers can view wish forms" ON public.wish_forms;

CREATE POLICY "Requesters and businesses can view wish forms"
  ON public.wish_forms
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR provider_id = public.get_user_business_id()
    OR is_admin()
  );