-- Add missing fields to marinas table for complete profile
ALTER TABLE public.marinas
ADD COLUMN IF NOT EXISTS transient_rate_per_ft NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_base_rate NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS require_insurance_long_term BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_registration BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_approve_transient BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_gas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_diesel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pool BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pumpout BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_laundry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_restaurant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_security BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Create storage bucket for marina photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('marina-photos', 'marina-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for marina photos
CREATE POLICY "Marina managers can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marina-photos' AND is_marina_manager());

CREATE POLICY "Marina managers can update their photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'marina-photos' AND is_marina_manager());

CREATE POLICY "Marina managers can delete their photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'marina-photos' AND is_marina_manager());

CREATE POLICY "Anyone can view marina photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'marina-photos');

-- Add public read policy for marinas (for discovery)
CREATE POLICY "Public can view marina listings"
ON public.marinas FOR SELECT
USING (true);

-- Update RLS to allow admins to insert marinas (for seeding)
CREATE POLICY "Admins can manage all marinas"
ON public.marinas FOR ALL
USING (is_admin());