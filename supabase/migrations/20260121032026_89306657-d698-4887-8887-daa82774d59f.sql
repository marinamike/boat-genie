-- Add access_type and lockbox_code to boat_profiles
ALTER TABLE public.boat_profiles
ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'open_access',
ADD COLUMN IF NOT EXISTS lockbox_code text;

-- Add is_emergency and calculated_price to wish_forms
ALTER TABLE public.wish_forms
ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS calculated_price numeric,
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Create storage bucket for wish form photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wish-photos', 'wish-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for wish-photos bucket
CREATE POLICY "Users can upload wish photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wish-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own wish photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wish-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
    OR public.has_role(auth.uid(), 'provider'::app_role)
  )
);

CREATE POLICY "Users can delete their own wish photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wish-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);