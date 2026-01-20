-- Create enum for marina modules/plugins
CREATE TYPE public.marina_module AS ENUM ('dry_stack', 'ship_store', 'fuel_dock', 'service_yard');

-- Create marina_settings table for module toggles and configuration
CREATE TABLE public.marina_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    marina_name text NOT NULL DEFAULT 'My Marina',
    enabled_modules marina_module[] NOT NULL DEFAULT '{}',
    staging_dock_capacity_ft numeric NOT NULL DEFAULT 500,
    capacity_alert_threshold numeric NOT NULL DEFAULT 0.9,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marina_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage marina settings
CREATE POLICY "Admins can manage marina settings"
ON public.marina_settings FOR ALL
USING (is_admin());

-- Authenticated users can view settings
CREATE POLICY "Authenticated users can view marina settings"
ON public.marina_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create slips table for dock/staging management
CREATE TABLE public.marina_slips (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slip_number text NOT NULL,
    slip_type text NOT NULL DEFAULT 'dock', -- 'dock', 'staging', 'dry_stack'
    max_length_ft numeric NOT NULL DEFAULT 30,
    is_occupied boolean NOT NULL DEFAULT false,
    current_boat_id uuid REFERENCES public.boats(id) ON DELETE SET NULL,
    current_boat_length_ft numeric,
    notes text,
    position_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marina_slips ENABLE ROW LEVEL SECURITY;

-- Admins can manage slips
CREATE POLICY "Admins can manage slips"
ON public.marina_slips FOR ALL
USING (is_admin());

-- Providers can view slips
CREATE POLICY "Providers can view slips"
ON public.marina_slips FOR SELECT
USING (has_role(auth.uid(), 'provider') OR is_admin());

-- Create welcome_packet_files table for digital welcome materials
CREATE TABLE public.welcome_packet_files (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL, -- 'pdf', 'image'
    description text,
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_packet_files ENABLE ROW LEVEL SECURITY;

-- Admins can manage welcome packet files
CREATE POLICY "Admins can manage welcome packet files"
ON public.welcome_packet_files FOR ALL
USING (is_admin());

-- Authenticated users can view active files
CREATE POLICY "Users can view active welcome packet files"
ON public.welcome_packet_files FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Create boat_checkins table to track when boaters check in
CREATE TABLE public.boat_checkins (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL,
    slip_id uuid REFERENCES public.marina_slips(id) ON DELETE SET NULL,
    checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
    checked_out_at timestamp with time zone,
    welcome_packet_sent boolean NOT NULL DEFAULT false,
    welcome_packet_sent_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boat_checkins ENABLE ROW LEVEL SECURITY;

-- Admins can manage all checkins
CREATE POLICY "Admins can manage checkins"
ON public.boat_checkins FOR ALL
USING (is_admin());

-- Owners can view their own checkins
CREATE POLICY "Owners can view their checkins"
ON public.boat_checkins FOR SELECT
USING (owner_id = auth.uid() OR is_admin());

-- Providers can view checkins
CREATE POLICY "Providers can view checkins"
ON public.boat_checkins FOR SELECT
USING (has_role(auth.uid(), 'provider'));

-- Add triggers for updated_at
CREATE TRIGGER update_marina_settings_updated_at
BEFORE UPDATE ON public.marina_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marina_slips_updated_at
BEFORE UPDATE ON public.marina_slips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_welcome_packet_files_updated_at
BEFORE UPDATE ON public.welcome_packet_files
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default marina settings
INSERT INTO public.marina_settings (marina_name, enabled_modules, staging_dock_capacity_ft)
VALUES ('Boat Genie Marina', ARRAY['dry_stack', 'ship_store', 'fuel_dock', 'service_yard']::marina_module[], 500);

-- Insert some default staging slips
INSERT INTO public.marina_slips (slip_number, slip_type, max_length_ft, position_order) VALUES
('S-1', 'staging', 40, 1),
('S-2', 'staging', 40, 2),
('S-3', 'staging', 50, 3),
('D-1', 'dock', 35, 1),
('D-2', 'dock', 35, 2),
('D-3', 'dock', 45, 3),
('D-4', 'dock', 45, 4),
('DS-1', 'dry_stack', 30, 1),
('DS-2', 'dry_stack', 30, 2);

-- Create storage bucket for welcome packet files
INSERT INTO storage.buckets (id, name, public) VALUES ('welcome-packets', 'welcome-packets', true);

-- Storage policies for welcome packets
CREATE POLICY "Anyone can view welcome packet files"
ON storage.objects FOR SELECT
USING (bucket_id = 'welcome-packets');

CREATE POLICY "Admins can upload welcome packet files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'welcome-packets' AND is_admin());

CREATE POLICY "Admins can update welcome packet files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'welcome-packets' AND is_admin());

CREATE POLICY "Admins can delete welcome packet files"
ON storage.objects FOR DELETE
USING (bucket_id = 'welcome-packets' AND is_admin());