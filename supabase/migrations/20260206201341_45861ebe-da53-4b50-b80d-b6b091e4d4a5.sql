-- Create recurring invoices table for long-term contracts
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL,
  yard_asset_id UUID REFERENCES public.yard_assets(id) ON DELETE SET NULL,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'monthly' CHECK (invoice_type IN ('monthly', 'seasonal', 'annual')),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  base_rent NUMERIC NOT NULL DEFAULT 0,
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
  additional_charges JSONB DEFAULT '[]',
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'overdue', 'void')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mid-stay meter readings table for long-term tenants
CREATE TABLE IF NOT EXISTS public.mid_stay_meter_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL,
  yard_asset_id UUID NOT NULL REFERENCES public.yard_assets(id) ON DELETE CASCADE,
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_period TEXT,
  added_to_invoice_id UUID REFERENCES public.recurring_invoices(id) ON DELETE SET NULL,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_stay_meter_readings ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_invoices
CREATE POLICY "Business owners can manage recurring invoices"
  ON public.recurring_invoices
  FOR ALL
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY "Business staff can manage recurring invoices"
  ON public.recurring_invoices
  FOR ALL
  USING (public.is_business_staff(business_id))
  WITH CHECK (public.is_business_staff(business_id));

CREATE POLICY "Boat owners can view their recurring invoices"
  ON public.recurring_invoices
  FOR SELECT
  USING (owner_id = auth.uid());

-- RLS policies for mid_stay_meter_readings
CREATE POLICY "Business owners can manage mid-stay readings"
  ON public.mid_stay_meter_readings
  FOR ALL
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY "Business staff can manage mid-stay readings"
  ON public.mid_stay_meter_readings
  FOR ALL
  USING (public.is_business_staff(business_id))
  WITH CHECK (public.is_business_staff(business_id));

-- Indexes
CREATE INDEX idx_recurring_invoices_business ON public.recurring_invoices(business_id);
CREATE INDEX idx_recurring_invoices_lease ON public.recurring_invoices(lease_id);
CREATE INDEX idx_recurring_invoices_status ON public.recurring_invoices(status);
CREATE INDEX idx_recurring_invoices_period ON public.recurring_invoices(billing_period_start, billing_period_end);
CREATE INDEX idx_mid_stay_meter_readings_business ON public.mid_stay_meter_readings(business_id);
CREATE INDEX idx_mid_stay_meter_readings_lease ON public.mid_stay_meter_readings(lease_id);
CREATE INDEX idx_mid_stay_meter_readings_date ON public.mid_stay_meter_readings(reading_date);

-- Add trigger for updated_at
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();