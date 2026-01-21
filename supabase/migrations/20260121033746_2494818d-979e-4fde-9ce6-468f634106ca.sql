-- Create enum for pricing model
CREATE TYPE public.pricing_model AS ENUM ('per_foot', 'flat_rate');

-- Create provider_services table for service catalog
CREATE TABLE public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  pricing_model pricing_model NOT NULL DEFAULT 'per_foot',
  price numeric NOT NULL CHECK (price >= 0),
  description text,
  category text NOT NULL DEFAULT 'General',
  is_active boolean NOT NULL DEFAULT true,
  is_locked boolean NOT NULL DEFAULT false,
  locked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_name)
);

-- Enable RLS
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own services
CREATE POLICY "Providers can manage their own services"
ON public.provider_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.provider_profiles pp
    WHERE pp.id = provider_services.provider_id
    AND pp.user_id = auth.uid()
  )
);

-- Anyone authenticated can view active provider services
CREATE POLICY "Authenticated users can view active services"
ON public.provider_services
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins can manage all services
CREATE POLICY "Admins can manage all services"
ON public.provider_services
FOR ALL
USING (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_provider_services_updated_at
BEFORE UPDATE ON public.provider_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_provider_services_provider_id ON public.provider_services(provider_id);
CREATE INDEX idx_provider_services_category ON public.provider_services(category);