-- Create vessel_specs master table for boat specifications
CREATE TABLE public.vessel_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_start INTEGER,
  year_end INTEGER,
  -- Dimensions
  length_ft NUMERIC,
  beam_ft NUMERIC,
  draft_ft NUMERIC,
  bridge_clearance_ft NUMERIC,
  dry_weight_lbs INTEGER,
  -- Capacities
  fuel_capacity_gal NUMERIC,
  water_capacity_gal NUMERIC,
  holding_capacity_gal NUMERIC,
  -- Electrical
  battery_type TEXT,
  battery_count INTEGER,
  battery_locations TEXT,
  shore_power TEXT,
  -- Propulsion defaults
  max_hp INTEGER,
  engine_options TEXT[],
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_defaults table for manufacturer warranty info
CREATE TABLE public.warranty_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'boat', 'engine', 'generator', 'seakeeper'
  warranty_name TEXT NOT NULL,
  warranty_months INTEGER NOT NULL,
  warranty_description TEXT,
  warranty_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boat_warranties table for tracking individual boat warranties
CREATE TABLE public.boat_warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  boat_equipment_id UUID REFERENCES public.boat_equipment(id) ON DELETE CASCADE,
  warranty_type TEXT NOT NULL, -- 'manufacturer', 'extended', 'insurance'
  warranty_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  document_url TEXT,
  notes TEXT,
  warranty_default_id UUID REFERENCES public.warranty_defaults(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.vessel_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_warranties ENABLE ROW LEVEL SECURITY;

-- RLS policies for vessel_specs (read-only for all authenticated users)
CREATE POLICY "Anyone can view vessel specs" 
  ON public.vessel_specs FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage vessel specs" 
  ON public.vessel_specs FOR ALL 
  USING (is_admin());

-- RLS policies for warranty_defaults (read-only for all authenticated users)
CREATE POLICY "Anyone can view warranty defaults" 
  ON public.warranty_defaults FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage warranty defaults" 
  ON public.warranty_defaults FOR ALL 
  USING (is_admin());

-- RLS policies for boat_warranties (owners can manage their own)
CREATE POLICY "Owners can view their boat warranties" 
  ON public.boat_warranties FOR SELECT 
  USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can create boat warranties" 
  ON public.boat_warranties FOR INSERT 
  WITH CHECK (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can update their boat warranties" 
  ON public.boat_warranties FOR UPDATE 
  USING (owns_boat(boat_id) OR is_admin());

CREATE POLICY "Owners can delete their boat warranties" 
  ON public.boat_warranties FOR DELETE 
  USING (owns_boat(boat_id) OR is_admin());

-- Seed vessel_specs with 3 popular Fort Lauderdale boats
INSERT INTO public.vessel_specs (make, model, year_start, year_end, length_ft, beam_ft, draft_ft, bridge_clearance_ft, dry_weight_lbs, fuel_capacity_gal, water_capacity_gal, holding_capacity_gal, battery_type, battery_count, battery_locations, shore_power, max_hp, engine_options) VALUES
('SeaVee', '340Z', 2018, NULL, 34, 10.5, 2.5, 8.5, 8500, 350, 30, 15, 'AGM Deep Cycle', 3, 'Engine compartment (2), Console (1)', '30 Amp', 1050, ARRAY['Triple Yamaha F350', 'Triple Mercury Verado 400', 'Quad Yamaha F300']),
('Boston Whaler', '320 Vantage', 2019, NULL, 32, 10.5, 2.25, 9.5, 9800, 265, 26, 10, 'AGM Marine', 2, 'Under console, Engine compartment', '30 Amp', 600, ARRAY['Twin Mercury Verado 300', 'Twin Yamaha F300', 'Triple Mercury 225']),
('Sea Ray', 'Sundancer 320', 2017, NULL, 35, 11.5, 3.25, 11, 14500, 150, 40, 25, 'AGM Deep Cycle', 3, 'Engine room (2), Helm (1)', '50 Amp', 700, ARRAY['Twin MerCruiser 6.2L', 'Twin Volvo Penta D4', 'Twin Cummins QSB']);

-- Seed warranty_defaults with manufacturer warranties
INSERT INTO public.warranty_defaults (brand, product_type, warranty_name, warranty_months, warranty_description, warranty_pdf_url) VALUES
-- Boat manufacturers
('Boston Whaler', 'boat', 'Limited Lifetime Hull Warranty', 600, 'Lifetime structural hull warranty for original owner', 'https://www.bostonwhaler.com/warranty.html'),
('SeaVee', 'boat', '5-Year Structural Hull Warranty', 60, 'Limited structural warranty covering hull defects', NULL),
('Sea Ray', 'boat', '5-Year Limited Warranty', 60, 'Comprehensive coverage for hull, deck, and components', 'https://www.searay.com/warranty'),
-- Engine manufacturers
('Yamaha', 'engine', '3-Year Limited Warranty', 36, 'Factory warranty covering manufacturing defects', 'https://www.yamahaoutboards.com/warranty'),
('Mercury', 'engine', '3-Year Factory Warranty', 36, 'Standard factory coverage for outboard engines', 'https://www.mercurymarine.com/warranty'),
('MerCruiser', 'engine', '2-Year Factory Warranty', 24, 'Sterndrive and inboard engine coverage', 'https://www.mercurymarine.com/warranty'),
('Volvo Penta', 'engine', '2-Year Factory Warranty', 24, 'Marine diesel and gas engine coverage', NULL),
-- Generator manufacturers
('Kohler', 'generator', '5-Year Limited Warranty', 60, 'Marine generator comprehensive coverage', NULL),
('Onan', 'generator', '3-Year Limited Warranty', 36, 'Cummins Onan marine genset warranty', NULL),
('Westerbeke', 'generator', '2-Year Factory Warranty', 24, 'Standard marine generator coverage', NULL),
-- Seakeeper
('Seakeeper', 'seakeeper', '3-Year Limited Warranty', 36, 'Gyro stabilizer limited warranty', 'https://www.seakeeper.com/warranty');