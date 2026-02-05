-- Fuel & Fluid Management Module Tables

-- Fuel tanks table
CREATE TABLE public.fuel_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tank_name TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'gasoline', 'premium')),
  total_capacity_gallons NUMERIC NOT NULL DEFAULT 0,
  current_volume_gallons NUMERIC NOT NULL DEFAULT 0,
  low_level_threshold_gallons NUMERIC NOT NULL DEFAULT 500,
  last_delivery_date TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel pumps table
CREATE TABLE public.fuel_pumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  pump_name TEXT NOT NULL,
  pump_number TEXT,
  lifetime_meter_gallons NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel transactions (sales)
CREATE TABLE public.fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  pump_id UUID NOT NULL REFERENCES public.fuel_pumps(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  gallons_sold NUMERIC NOT NULL,
  price_per_gallon NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  vessel_name TEXT,
  vessel_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.marina_reservations(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel deliveries
CREATE TABLE public.fuel_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  gallons_delivered NUMERIC NOT NULL,
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  vendor_name TEXT,
  invoice_number TEXT,
  cost_per_gallon NUMERIC,
  total_cost NUMERIC,
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel reconciliations (dip readings)
CREATE TABLE public.fuel_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  physical_reading_gallons NUMERIC NOT NULL,
  theoretical_volume_gallons NUMERIC NOT NULL,
  discrepancy_gallons NUMERIC NOT NULL,
  discrepancy_percentage NUMERIC NOT NULL,
  measurement_type TEXT NOT NULL DEFAULT 'gallons' CHECK (measurement_type IN ('gallons', 'inches')),
  raw_measurement NUMERIC,
  notes TEXT,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fuel_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_tanks
CREATE POLICY "Business owners can manage fuel tanks"
ON public.fuel_tanks FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- RLS Policies for fuel_pumps
CREATE POLICY "Business owners can manage fuel pumps"
ON public.fuel_pumps FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- RLS Policies for fuel_transactions
CREATE POLICY "Business staff can view fuel transactions"
ON public.fuel_transactions FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business staff can create fuel transactions"
ON public.fuel_transactions FOR INSERT
WITH CHECK (is_business_owner(business_id) OR has_module_permission(business_id, 'fuel', 'write'));

-- RLS Policies for fuel_deliveries (restricted to owners/admins)
CREATE POLICY "Business owners can manage fuel deliveries"
ON public.fuel_deliveries FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Staff with write permission can create deliveries"
ON public.fuel_deliveries FOR INSERT
WITH CHECK (has_module_permission(business_id, 'fuel', 'write'));

CREATE POLICY "Staff can view deliveries"
ON public.fuel_deliveries FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- RLS Policies for fuel_reconciliations (restricted to owners/admins)
CREATE POLICY "Business owners can manage reconciliations"
ON public.fuel_reconciliations FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Staff with write permission can create reconciliations"
ON public.fuel_reconciliations FOR INSERT
WITH CHECK (has_module_permission(business_id, 'fuel', 'write'));

CREATE POLICY "Staff can view reconciliations"
ON public.fuel_reconciliations FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- Triggers for updated_at
CREATE TRIGGER update_fuel_tanks_updated_at
BEFORE UPDATE ON public.fuel_tanks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_pumps_updated_at
BEFORE UPDATE ON public.fuel_pumps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();