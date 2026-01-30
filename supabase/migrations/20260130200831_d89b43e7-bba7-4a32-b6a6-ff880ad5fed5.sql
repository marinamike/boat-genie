-- Add RLS policy to allow providers to view boat details for available wishes
-- This allows providers to see make, model, year, length_ft for boats with pending wishes
-- Note: The boat NAME and location remain hidden in the UI until job acceptance

CREATE POLICY "Providers can view boats with available wishes"
ON public.boats
FOR SELECT
USING (
  has_role(auth.uid(), 'provider'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.wish_forms wf
    WHERE wf.boat_id = boats.id
    AND wf.status IN ('submitted', 'reviewed', 'approved')
  )
);