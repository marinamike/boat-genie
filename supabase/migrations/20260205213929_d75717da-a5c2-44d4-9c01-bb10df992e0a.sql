-- Create enum for asset types
CREATE TYPE public.yard_asset_type AS ENUM ('wet_slip', 'dry_rack', 'yard_block', 'mooring');

-- Create enum for meter types
CREATE TYPE public.utility_meter_type AS ENUM ('power', 'water');

-- Create enum for lease status
CREATE TYPE public.lease_status AS ENUM ('active', 'pending', 'expired', 'terminated');

-- Yard Assets table (slips, dry racks, yard blocks)
CREATE TABLE public.yard_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type yard_asset_type NOT NULL DEFAULT 'wet_slip',
  dock_section TEXT,
  max_loa_ft NUMERIC,
  max_beam_ft NUMERIC,
  max_draft_ft NUMERIC,
  position_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  current_boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  current_reservation_id UUID REFERENCES public.marina_reservations(id) ON DELETE SET NULL,
  monthly_rate NUMERIC,
  daily_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Utility Meters table
CREATE TABLE public.utility_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  yard_asset_id UUID REFERENCES public.yard_assets(id) ON DELETE CASCADE,
  meter_type utility_meter_type NOT NULL,
  meter_name TEXT NOT NULL,
  meter_number TEXT,
  rate_per_unit NUMERIC NOT NULL DEFAULT 0.15,
  current_reading NUMERIC DEFAULT 0,
  last_reading_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Meter Readings table
CREATE TABLE public.meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  previous_reading NUMERIC NOT NULL,
  current_reading NUMERIC NOT NULL,
  usage_amount NUMERIC GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
  rate_per_unit NUMERIC NOT NULL,
  total_charge NUMERIC GENERATED ALWAYS AS ((current_reading - previous_reading) * rate_per_unit) STORED,
  reading_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  recorded_by UUID NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  is_billed BOOLEAN DEFAULT false,
  invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Lease Agreements table
CREATE TABLE public.lease_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  yard_asset_id UUID NOT NULL REFERENCES public.yard_assets(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  lease_status lease_status NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rate NUMERIC NOT NULL,
  deposit_amount NUMERIC DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  auto_renew BOOLEAN DEFAULT false,
  renewal_months INTEGER DEFAULT 12,
  power_included BOOLEAN DEFAULT false,
  water_included BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  registration_verified BOOLEAN DEFAULT false,
  contract_doc_url TEXT,
  terms_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Power Tap Alerts table (for tracking overdue power bills or alerts)
CREATE TABLE public.power_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  yard_asset_id UUID NOT NULL REFERENCES public.yard_assets(id) ON DELETE CASCADE,
  meter_id UUID REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'overdue_bill',
  alert_message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add utility_rate to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS power_rate_per_kwh NUMERIC DEFAULT 0.15,
ADD COLUMN IF NOT EXISTS water_rate_per_gallon NUMERIC DEFAULT 0.01;

-- Enable RLS
ALTER TABLE public.yard_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yard_assets
CREATE POLICY "Business owners can manage yard assets"
ON public.yard_assets FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Boat owners can view assets with their boats"
ON public.yard_assets FOR SELECT
USING (current_boat_id IN (SELECT id FROM public.boats WHERE owner_id = auth.uid()));

-- RLS Policies for utility_meters
CREATE POLICY "Business owners can manage utility meters"
ON public.utility_meters FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- RLS Policies for meter_readings
CREATE POLICY "Business owners can manage meter readings"
ON public.meter_readings FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Boat owners can view their meter readings"
ON public.meter_readings FOR SELECT
USING (boat_id IN (SELECT id FROM public.boats WHERE owner_id = auth.uid()));

-- RLS Policies for lease_agreements
CREATE POLICY "Business owners can manage lease agreements"
ON public.lease_agreements FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Boat owners can view their leases"
ON public.lease_agreements FOR SELECT
USING (owner_id = auth.uid());

-- RLS Policies for power_alerts
CREATE POLICY "Business owners can manage power alerts"
ON public.power_alerts FOR ALL
USING (is_business_owner(business_id) OR is_business_staff(business_id));

-- Add 'slips' to business_module enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'slips' AND enumtypid = 'business_module'::regtype) THEN
    ALTER TYPE public.business_module ADD VALUE 'slips';
  END IF;
END$$;

-- Create indexes for performance
CREATE INDEX idx_yard_assets_business ON public.yard_assets(business_id);
CREATE INDEX idx_yard_assets_dock ON public.yard_assets(business_id, dock_section);
CREATE INDEX idx_utility_meters_asset ON public.utility_meters(yard_asset_id);
CREATE INDEX idx_meter_readings_meter ON public.meter_readings(meter_id);
CREATE INDEX idx_lease_agreements_asset ON public.lease_agreements(yard_asset_id);
CREATE INDEX idx_lease_agreements_owner ON public.lease_agreements(owner_id);

-- Triggers for updated_at
CREATE TRIGGER update_yard_assets_updated_at
BEFORE UPDATE ON public.yard_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_utility_meters_updated_at
BEFORE UPDATE ON public.utility_meters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lease_agreements_updated_at
BEFORE UPDATE ON public.lease_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();