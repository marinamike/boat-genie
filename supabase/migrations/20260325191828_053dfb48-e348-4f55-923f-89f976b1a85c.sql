
-- Create guest_customers table
CREATE TABLE public.guest_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  phone TEXT,
  boat_name TEXT NOT NULL,
  boat_make TEXT,
  boat_model TEXT,
  boat_length_ft NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add guest_customer_id to work_orders
ALTER TABLE public.work_orders ADD COLUMN guest_customer_id UUID REFERENCES public.guest_customers(id);

-- Enable RLS
ALTER TABLE public.guest_customers ENABLE ROW LEVEL SECURITY;

-- RLS: business owner or staff can manage their guest customers
CREATE POLICY "Business owner can manage guest customers"
  ON public.guest_customers
  FOR ALL
  TO authenticated
  USING (public.is_business_owner(business_id) OR public.is_business_staff(business_id))
  WITH CHECK (public.is_business_owner(business_id) OR public.is_business_staff(business_id));
