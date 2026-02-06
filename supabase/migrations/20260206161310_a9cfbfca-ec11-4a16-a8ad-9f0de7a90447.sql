-- Add verification status enum and column to businesses
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';

-- Add is_banned column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add flagged/reported column to provider_reviews if exists, or create reviews table
CREATE TABLE IF NOT EXISTS public.platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_reported BOOLEAN DEFAULT false,
  report_reason TEXT,
  reported_at TIMESTAMP WITH TIME ZONE,
  reported_by UUID,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on platform_reviews
ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Platform admin can do everything (checked at app level via email)
CREATE POLICY "Platform admin full access on reviews"
ON public.platform_reviews
FOR ALL
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_platform_reviews_updated_at
BEFORE UPDATE ON public.platform_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick filtering
CREATE INDEX idx_platform_reviews_reported ON public.platform_reviews(is_reported) WHERE is_reported = true;
CREATE INDEX idx_businesses_verification ON public.businesses(verification_status);