-- Create provider_profiles table for service provider business info
CREATE TABLE public.provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT,
  service_categories TEXT[] NOT NULL DEFAULT '{}',
  insurance_doc_url TEXT,
  insurance_expiry DATE,
  bio TEXT,
  hourly_rate NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- Providers can view and manage their own profile
CREATE POLICY "Providers can manage their own profile"
ON public.provider_profiles FOR ALL
USING (user_id = auth.uid());

-- Admins can view all provider profiles
CREATE POLICY "Admins can view all provider profiles"
ON public.provider_profiles FOR SELECT
USING (is_admin());

-- Boat owners can view provider profiles (for hiring)
CREATE POLICY "Boat owners can view provider profiles"
ON public.provider_profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_profiles_updated_at
BEFORE UPDATE ON public.provider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add marina_staff to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'marina_staff' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'marina_staff';
  END IF;
END $$;

-- Create marina_staff_requests table for staff join requests
CREATE TABLE public.marina_staff_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marina_id UUID NOT NULL REFERENCES public.marinas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  notes TEXT,
  UNIQUE(user_id, marina_id)
);

-- Enable RLS
ALTER TABLE public.marina_staff_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own staff requests
CREATE POLICY "Users can create their own staff requests"
ON public.marina_staff_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own requests
CREATE POLICY "Users can view their own staff requests"
ON public.marina_staff_requests FOR SELECT
USING (user_id = auth.uid());

-- Marina managers can view and manage requests for their marina
CREATE POLICY "Marina managers can manage staff requests"
ON public.marina_staff_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.marinas 
  WHERE marinas.id = marina_staff_requests.marina_id 
  AND marinas.manager_id = auth.uid()
));

-- Admins can manage all requests
CREATE POLICY "Admins can manage all staff requests"
ON public.marina_staff_requests FOR ALL
USING (is_admin());