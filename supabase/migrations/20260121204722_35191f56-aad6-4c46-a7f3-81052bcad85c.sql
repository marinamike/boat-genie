-- Create master_equipment_specs table for storing manufacturer specs
CREATE TABLE public.master_equipment_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('engine', 'generator', 'seakeeper')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  manual_url TEXT,
  service_interval_hours INTEGER,
  service_interval_months INTEGER,
  service_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipment_type, brand, model)
);

-- Enable RLS
ALTER TABLE public.master_equipment_specs ENABLE ROW LEVEL SECURITY;

-- Anyone can view equipment specs (public reference data)
CREATE POLICY "Anyone can view equipment specs"
ON public.master_equipment_specs
FOR SELECT
USING (true);

-- Only admins can manage equipment specs
CREATE POLICY "Admins can manage equipment specs"
ON public.master_equipment_specs
FOR ALL
USING (is_admin());

-- Add equipment columns to boats table
ALTER TABLE public.boats
ADD COLUMN IF NOT EXISTS engine_brand TEXT,
ADD COLUMN IF NOT EXISTS engine_model TEXT,
ADD COLUMN IF NOT EXISTS engine_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS generator_brand TEXT,
ADD COLUMN IF NOT EXISTS generator_model TEXT,
ADD COLUMN IF NOT EXISTS generator_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seakeeper_model TEXT,
ADD COLUMN IF NOT EXISTS seakeeper_hours INTEGER DEFAULT 0;

-- Create maintenance_recommendations table for tracking scheduled maintenance
CREATE TABLE public.maintenance_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  equipment_spec_id UUID REFERENCES public.master_equipment_specs(id) ON DELETE SET NULL,
  equipment_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at_hours INTEGER,
  due_at_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  converted_to_wish_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_recommendations ENABLE ROW LEVEL SECURITY;

-- Owners can view their boat's recommendations
CREATE POLICY "Owners can view their boat recommendations"
ON public.maintenance_recommendations
FOR SELECT
USING (owns_boat(boat_id) OR is_admin());

-- Owners can manage their boat's recommendations
CREATE POLICY "Owners can manage their boat recommendations"
ON public.maintenance_recommendations
FOR ALL
USING (owns_boat(boat_id) OR is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_master_equipment_specs_updated_at
BEFORE UPDATE ON public.master_equipment_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_recommendations_updated_at
BEFORE UPDATE ON public.maintenance_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some initial equipment specs
INSERT INTO public.master_equipment_specs (equipment_type, brand, model, manual_url, service_interval_hours, service_interval_months, service_description) VALUES
-- Yamaha Engines
('engine', 'Yamaha', 'F150', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
('engine', 'Yamaha', 'F200', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
('engine', 'Yamaha', 'F250', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
('engine', 'Yamaha', 'F300', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
('engine', 'Yamaha', 'F350', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
('engine', 'Yamaha', 'F425', 'https://www.yamaha-motor.com/outboard/owners-manuals', 100, 12, '100-Hour Service: Change engine oil, replace oil filter, inspect fuel filter'),
-- Mercury Engines
('engine', 'Mercury', 'Verado 250', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change engine oil, replace filters, inspect anodes'),
('engine', 'Mercury', 'Verado 300', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change engine oil, replace filters, inspect anodes'),
('engine', 'Mercury', 'Verado 350', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change engine oil, replace filters, inspect anodes'),
('engine', 'Mercury', 'Verado 400', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change engine oil, replace filters, inspect anodes'),
('engine', 'Mercury', 'Pro XS 150', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change lower unit oil, inspect spark plugs'),
('engine', 'Mercury', 'Pro XS 200', 'https://www.mercurymarine.com/en/us/support/manuals/', 100, 12, '100-Hour Service: Change lower unit oil, inspect spark plugs'),
-- Volvo Engines
('engine', 'Volvo Penta', 'D4-300', 'https://www.volvopenta.com/marineleisure/support/manuals-and-documents/', 200, 12, '200-Hour Service: Change oil, replace filters, check belt tension'),
('engine', 'Volvo Penta', 'D6-380', 'https://www.volvopenta.com/marineleisure/support/manuals-and-documents/', 200, 12, '200-Hour Service: Change oil, replace filters, check belt tension'),
('engine', 'Volvo Penta', 'D6-440', 'https://www.volvopenta.com/marineleisure/support/manuals-and-documents/', 200, 12, '200-Hour Service: Change oil, replace filters, check belt tension'),
('engine', 'Volvo Penta', 'IPS 400', 'https://www.volvopenta.com/marineleisure/support/manuals-and-documents/', 200, 12, '200-Hour Service: Change oil, replace filters, inspect drive'),
('engine', 'Volvo Penta', 'IPS 500', 'https://www.volvopenta.com/marineleisure/support/manuals-and-documents/', 200, 12, '200-Hour Service: Change oil, replace filters, inspect drive'),
-- Kohler Generators
('generator', 'Kohler', '5E', 'https://kohlerpower.com/en/marine/support/manuals', 100, 12, '100-Hour Generator Service: Change oil, replace spark plug, inspect exhaust'),
('generator', 'Kohler', '7.3E', 'https://kohlerpower.com/en/marine/support/manuals', 100, 12, '100-Hour Generator Service: Change oil, replace spark plug, inspect exhaust'),
('generator', 'Kohler', '9E', 'https://kohlerpower.com/en/marine/support/manuals', 100, 12, '100-Hour Generator Service: Change oil, replace spark plug, inspect exhaust'),
('generator', 'Kohler', '11E', 'https://kohlerpower.com/en/marine/support/manuals', 100, 12, '100-Hour Generator Service: Change oil, replace spark plug, inspect exhaust'),
('generator', 'Kohler', '13.5E', 'https://kohlerpower.com/en/marine/support/manuals', 100, 12, '100-Hour Generator Service: Change oil, replace spark plug, inspect exhaust'),
-- Onan Generators
('generator', 'Onan', 'MDKAV 5', 'https://www.cumminsgenerators.com/support/manuals', 150, 12, '150-Hour Generator Service: Change oil, replace filters, inspect impeller'),
('generator', 'Onan', 'MDKBH 7.5', 'https://www.cumminsgenerators.com/support/manuals', 150, 12, '150-Hour Generator Service: Change oil, replace filters, inspect impeller'),
('generator', 'Onan', 'MDKBJ 8', 'https://www.cumminsgenerators.com/support/manuals', 150, 12, '150-Hour Generator Service: Change oil, replace filters, inspect impeller'),
('generator', 'Onan', 'MDKBU 12', 'https://www.cumminsgenerators.com/support/manuals', 150, 12, '150-Hour Generator Service: Change oil, replace filters, inspect impeller'),
-- Seakeeper
('seakeeper', 'Seakeeper', '1', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '2', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '3', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '5', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '6', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '9', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '16', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment'),
('seakeeper', 'Seakeeper', '18', 'https://www.seakeeper.com/support/manuals/', 1000, 24, '1000-Hour Seakeeper Service: Check fluid levels, inspect seals, verify alignment');