
-- Create business_service_menu table
CREATE TABLE public.business_service_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  pricing_model TEXT NOT NULL DEFAULT 'fixed',
  default_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_service_menu ENABLE ROW LEVEL SECURITY;

-- Business members can view their service menu
CREATE POLICY "Business members can view service menu"
ON public.business_service_menu FOR SELECT TO authenticated
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR business_id IN (SELECT business_id FROM business_staff WHERE user_id = auth.uid() AND status = 'active')
);

-- Business owners can insert service menu items
CREATE POLICY "Business owners can insert service menu"
ON public.business_service_menu FOR INSERT TO authenticated
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Business owners can update service menu items
CREATE POLICY "Business owners can update service menu"
ON public.business_service_menu FOR UPDATE TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Business owners can delete service menu items
CREATE POLICY "Business owners can delete service menu"
ON public.business_service_menu FOR DELETE TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_business_service_menu_updated_at
BEFORE UPDATE ON public.business_service_menu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
