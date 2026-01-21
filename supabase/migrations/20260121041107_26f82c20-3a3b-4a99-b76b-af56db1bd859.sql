-- Create table for marina QR codes
CREATE TABLE public.marina_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marina_id UUID REFERENCES public.marinas(id),
  slip_id UUID REFERENCES public.marina_slips(id),
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for provider check-in logs
CREATE TABLE public.provider_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  boat_id UUID NOT NULL REFERENCES public.boats(id),
  check_in_method TEXT NOT NULL CHECK (check_in_method IN ('qr_verified', 'manual_gps')),
  qr_code_id UUID REFERENCES public.marina_qr_codes(id),
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  gps_accuracy_meters NUMERIC,
  manual_reason TEXT,
  distance_from_marina_ft NUMERIC,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marina_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_checkins ENABLE ROW LEVEL SECURITY;

-- QR Code policies
CREATE POLICY "Admins and marina managers can manage QR codes"
  ON public.marina_qr_codes FOR ALL
  USING (is_admin() OR is_marina_manager());

CREATE POLICY "Providers can view active QR codes for verification"
  ON public.marina_qr_codes FOR SELECT
  USING (is_active = true AND has_role(auth.uid(), 'provider'));

-- Check-in policies
CREATE POLICY "Providers can create their own check-ins"
  ON public.provider_checkins FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can view their own check-ins"
  ON public.provider_checkins FOR SELECT
  USING (provider_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all check-ins"
  ON public.provider_checkins FOR ALL
  USING (is_admin());

-- Add marina coordinates to marinas table
ALTER TABLE public.marinas ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.marinas ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add check-in reference to work orders
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS provider_checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS check_in_method TEXT;

-- Create index for QR code lookups
CREATE INDEX idx_marina_qr_codes_code ON public.marina_qr_codes(code);
CREATE INDEX idx_provider_checkins_work_order ON public.provider_checkins(work_order_id);