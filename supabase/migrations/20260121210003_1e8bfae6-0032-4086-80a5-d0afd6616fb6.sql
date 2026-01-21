
-- Create boat_equipment table for multi-engine/component support
CREATE TABLE public.boat_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('engine', 'generator', 'seakeeper')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  current_hours INTEGER DEFAULT 0,
  position_label TEXT, -- e.g., "Port Engine", "Starboard Engine", "Center Engine"
  position_order INTEGER DEFAULT 1,
  equipment_spec_id UUID REFERENCES public.master_equipment_specs(id),
  manual_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_boat_equipment_boat_id ON public.boat_equipment(boat_id);
CREATE INDEX idx_boat_equipment_type ON public.boat_equipment(equipment_type);

-- Enable RLS
ALTER TABLE public.boat_equipment ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Owners can view their boat equipment"
  ON public.boat_equipment FOR SELECT
  USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can create boat equipment"
  ON public.boat_equipment FOR INSERT
  WITH CHECK (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can update their boat equipment"
  ON public.boat_equipment FOR UPDATE
  USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can delete their boat equipment"
  ON public.boat_equipment FOR DELETE
  USING (owns_boat(boat_id) OR is_admin());

-- Providers can view equipment for boats they have work orders on
CREATE POLICY "Providers can view equipment for assigned boats"
  ON public.boat_equipment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo 
      WHERE wo.boat_id = boat_equipment.boat_id 
      AND wo.provider_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_boat_equipment_updated_at
  BEFORE UPDATE ON public.boat_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update maintenance_recommendations to link to specific equipment
ALTER TABLE public.maintenance_recommendations 
  ADD COLUMN boat_equipment_id UUID REFERENCES public.boat_equipment(id) ON DELETE CASCADE;
