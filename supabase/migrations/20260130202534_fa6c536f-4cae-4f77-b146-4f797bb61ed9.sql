-- Allow providers to create work orders when accepting jobs from wish forms
CREATE POLICY "Providers can create work orders for accepted jobs"
ON public.work_orders
FOR INSERT
WITH CHECK (
  provider_id = auth.uid() 
  AND has_role(auth.uid(), 'provider'::app_role)
);