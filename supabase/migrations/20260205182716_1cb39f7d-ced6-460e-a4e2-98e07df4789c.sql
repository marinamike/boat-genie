-- Create fuel_prices table for managing fuel pricing per fuel type
CREATE TABLE public.fuel_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL, -- 'gasoline', 'diesel', 'premium'
  cost_basis NUMERIC NOT NULL DEFAULT 0,
  retail_price NUMERIC NOT NULL DEFAULT 0,
  member_price NUMERIC, -- Optional member/discount price
  auto_margin_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_margin_amount NUMERIC DEFAULT 1.50, -- Amount above cost basis
  member_discount_enabled BOOLEAN NOT NULL DEFAULT false,
  member_discount_amount NUMERIC DEFAULT 0.10, -- Discount per gallon for members
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, fuel_type)
);

-- Create fuel_price_history table for tracking price changes
CREATE TABLE public.fuel_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL,
  cost_basis NUMERIC NOT NULL,
  retail_price NUMERIC NOT NULL,
  member_price NUMERIC,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_price_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for fuel_prices
CREATE POLICY "Business owners can manage fuel prices"
ON public.fuel_prices
FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Business staff can view fuel prices"
ON public.fuel_prices
FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- RLS policies for fuel_price_history
CREATE POLICY "Business owners can manage price history"
ON public.fuel_price_history
FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Business staff can view price history"
ON public.fuel_price_history
FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- Create trigger for updated_at
CREATE TRIGGER update_fuel_prices_updated_at
  BEFORE UPDATE ON public.fuel_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-log price history on update
CREATE OR REPLACE FUNCTION public.log_fuel_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if price actually changed
  IF OLD.retail_price IS DISTINCT FROM NEW.retail_price 
     OR OLD.cost_basis IS DISTINCT FROM NEW.cost_basis 
     OR OLD.member_price IS DISTINCT FROM NEW.member_price THEN
    INSERT INTO public.fuel_price_history (
      business_id, fuel_type, cost_basis, retail_price, member_price, changed_by
    ) VALUES (
      NEW.business_id, NEW.fuel_type, NEW.cost_basis, NEW.retail_price, NEW.member_price, NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_log_fuel_price_change
  AFTER UPDATE ON public.fuel_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.log_fuel_price_change();

-- Also log on initial insert
CREATE OR REPLACE FUNCTION public.log_fuel_price_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fuel_price_history (
    business_id, fuel_type, cost_basis, retail_price, member_price, changed_by
  ) VALUES (
    NEW.business_id, NEW.fuel_type, NEW.cost_basis, NEW.retail_price, NEW.member_price, NEW.updated_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_log_fuel_price_insert
  AFTER INSERT ON public.fuel_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.log_fuel_price_insert();