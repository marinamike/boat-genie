-- Create marinas table for marina registration
CREATE TABLE public.marinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL,
  marina_name TEXT NOT NULL,
  address TEXT,
  total_slips INTEGER NOT NULL DEFAULT 0,
  staging_dock_linear_footage NUMERIC NOT NULL DEFAULT 500,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manager_id)
);

-- Enable RLS
ALTER TABLE public.marinas ENABLE ROW LEVEL SECURITY;

-- Policies for marinas
CREATE POLICY "Managers can view their own marina"
ON public.marinas FOR SELECT
USING (manager_id = auth.uid() OR is_admin());

CREATE POLICY "Managers can insert their own marina"
ON public.marinas FOR INSERT
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Managers can update their own marina"
ON public.marinas FOR UPDATE
USING (manager_id = auth.uid() OR is_admin());

-- Update marina_settings to link to marinas table
ALTER TABLE public.marina_settings 
ADD COLUMN IF NOT EXISTS marina_id UUID REFERENCES public.marinas(id) ON DELETE CASCADE;

-- Create function to check if user is a marina manager
CREATE OR REPLACE FUNCTION public.is_marina_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.marinas WHERE manager_id = auth.uid()
  )
$$;

-- Create function to check user's role type
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::TEXT FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'boat_owner'
  )
$$;

-- Create trigger for updated_at on marinas
CREATE TRIGGER update_marinas_updated_at
BEFORE UPDATE ON public.marinas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();