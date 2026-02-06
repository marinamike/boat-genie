-- Track meter readings tied to specific stays
CREATE TABLE public.stay_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dock_status_id UUID NOT NULL REFERENCES public.dock_status(id) ON DELETE CASCADE,
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL CHECK (reading_type IN ('check_in', 'check_out', 'mid_stay')),
  reading_value NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice/billing records for stays
CREATE TABLE public.stay_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.marina_reservations(id) ON DELETE SET NULL,
  dock_status_id UUID NOT NULL REFERENCES public.dock_status(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  
  -- Stay billing details
  check_in_at TIMESTAMPTZ NOT NULL,
  check_out_at TIMESTAMPTZ NOT NULL,
  stay_days INTEGER NOT NULL,
  rate_tier TEXT NOT NULL CHECK (rate_tier IN ('daily', 'weekly', 'monthly', 'seasonal', 'annual')),
  rate_per_day NUMERIC NOT NULL DEFAULT 0,
  vessel_length_ft NUMERIC NOT NULL DEFAULT 0,
  stay_subtotal NUMERIC NOT NULL DEFAULT 0,
  
  -- Utility billing
  power_start_reading NUMERIC DEFAULT 0,
  power_end_reading NUMERIC DEFAULT 0,
  power_usage NUMERIC DEFAULT 0,
  power_rate NUMERIC DEFAULT 0,
  power_total NUMERIC DEFAULT 0,
  water_start_reading NUMERIC DEFAULT 0,
  water_end_reading NUMERIC DEFAULT 0,
  water_usage NUMERIC DEFAULT 0,
  water_rate NUMERIC DEFAULT 0,
  water_total NUMERIC DEFAULT 0,
  
  -- Totals
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid', 'void')),
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.stay_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for stay_meter_readings
CREATE POLICY "Business owners can manage stay meter readings" 
ON public.stay_meter_readings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.dock_status ds
    JOIN public.utility_meters um ON um.id = stay_meter_readings.meter_id
    WHERE ds.id = stay_meter_readings.dock_status_id
    AND public.is_business_owner(um.business_id)
  )
);

CREATE POLICY "Business staff can manage stay meter readings"
ON public.stay_meter_readings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dock_status ds
    JOIN public.utility_meters um ON um.id = stay_meter_readings.meter_id
    WHERE ds.id = stay_meter_readings.dock_status_id
    AND public.is_business_staff(um.business_id)
  )
);

-- RLS policies for stay_invoices
CREATE POLICY "Business owners can manage invoices" 
ON public.stay_invoices 
FOR ALL 
USING (public.is_business_owner(business_id));

CREATE POLICY "Business staff can manage invoices"
ON public.stay_invoices
FOR ALL
USING (public.is_business_staff(business_id));

CREATE POLICY "Boat owners can view their invoices"
ON public.stay_invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boats b
    WHERE b.id = stay_invoices.boat_id
    AND b.owner_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_stay_meter_readings_dock_status ON public.stay_meter_readings(dock_status_id);
CREATE INDEX idx_stay_meter_readings_meter ON public.stay_meter_readings(meter_id);
CREATE INDEX idx_stay_invoices_business ON public.stay_invoices(business_id);
CREATE INDEX idx_stay_invoices_reservation ON public.stay_invoices(reservation_id);
CREATE INDEX idx_stay_invoices_dock_status ON public.stay_invoices(dock_status_id);

-- Trigger for updated_at
CREATE TRIGGER update_stay_invoices_updated_at
BEFORE UPDATE ON public.stay_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();