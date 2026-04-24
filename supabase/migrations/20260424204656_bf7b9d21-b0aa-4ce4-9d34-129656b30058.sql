-- 1. Extend businesses table with emergency fee settings
ALTER TABLE public.businesses
  ADD COLUMN emergency_fee_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN emergency_fee_amount numeric NOT NULL DEFAULT 0;

-- 2. Create business_fees table
CREATE TABLE public.business_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'per_foot', 'percentage')),
  amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_fees_business_id ON public.business_fees(business_id);

-- 3. Enable RLS
ALTER TABLE public.business_fees ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Business members can view fees"
ON public.business_fees FOR SELECT
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

CREATE POLICY "Business members can insert fees"
ON public.business_fees FOR INSERT
TO authenticated
WITH CHECK (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

CREATE POLICY "Business members can update fees"
ON public.business_fees FOR UPDATE
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
)
WITH CHECK (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

CREATE POLICY "Business members can delete fees"
ON public.business_fees FOR DELETE
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);