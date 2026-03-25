
CREATE TABLE public.business_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  check_in_method TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qr_code_id UUID REFERENCES public.marina_qr_codes(id),
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_accuracy_meters DOUBLE PRECISION,
  manual_reason TEXT,
  distance_from_marina_ft DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their checkins"
  ON public.business_checkins
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_business_owner(business_id)
    OR public.is_business_staff(business_id)
    OR public.is_admin()
  );
