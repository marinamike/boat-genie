-- Add new fields to vessel_specs master table for Window Sheet data
ALTER TABLE public.vessel_specs 
ADD COLUMN IF NOT EXISTS loa_ft numeric,
ADD COLUMN IF NOT EXISTS draft_engines_up_ft numeric,
ADD COLUMN IF NOT EXISTS draft_engines_down_ft numeric,
ADD COLUMN IF NOT EXISTS livewell_capacity_gal numeric,
ADD COLUMN IF NOT EXISTS cruise_speed_knots numeric,
ADD COLUMN IF NOT EXISTS max_speed_knots numeric,
ADD COLUMN IF NOT EXISTS hull_type text;

-- Create a table for owner-specific boat specs (manual overrides)
CREATE TABLE IF NOT EXISTS public.boat_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  
  -- Physical dimensions
  loa_ft numeric,
  beam_ft numeric,
  draft_engines_up_ft numeric,
  draft_engines_down_ft numeric,
  bridge_clearance_ft numeric,
  dry_weight_lbs integer,
  
  -- Capacities
  fuel_capacity_gal numeric,
  water_capacity_gal numeric,
  holding_capacity_gal numeric,
  livewell_capacity_gal numeric,
  
  -- Performance
  cruise_speed_knots numeric,
  max_speed_knots numeric,
  hull_type text,
  
  -- Electrical
  battery_type text,
  battery_count integer,
  battery_locations text,
  shore_power text,
  
  -- Engine info
  max_hp integer,
  engine_options text[],
  
  -- Metadata
  is_custom_override boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT boat_specs_boat_id_unique UNIQUE (boat_id)
);

-- Enable RLS
ALTER TABLE public.boat_specs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boat_specs
CREATE POLICY "Owners can view their boat specs"
ON public.boat_specs
FOR SELECT
USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can create boat specs"
ON public.boat_specs
FOR INSERT
WITH CHECK (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can update their boat specs"
ON public.boat_specs
FOR UPDATE
USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can delete their boat specs"
ON public.boat_specs
FOR DELETE
USING (owns_boat(boat_id) OR is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_boat_specs_updated_at
BEFORE UPDATE ON public.boat_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();