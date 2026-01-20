-- Create enum for quote status
CREATE TYPE public.quote_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Create enum for escrow status  
CREATE TYPE public.escrow_status AS ENUM ('none', 'pending_quote', 'quoted', 'approved', 'work_started', 'pending_photos', 'pending_release', 'released', 'disputed');

-- Create enum for service type
CREATE TYPE public.service_type AS ENUM ('genie_service', 'pro_service');

-- Create service_rates configuration table
CREATE TABLE public.service_rates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name text NOT NULL,
    service_type service_type NOT NULL DEFAULT 'genie_service',
    rate_per_foot numeric DEFAULT NULL,
    diagnostic_fee numeric DEFAULT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on service_rates
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rates
CREATE POLICY "Anyone can view active service rates"
ON public.service_rates FOR SELECT
USING (is_active = true OR is_admin());

-- Only admins can manage rates
CREATE POLICY "Admins can manage service rates"
ON public.service_rates FOR ALL
USING (is_admin());

-- Create quotes table for the quote flow
CREATE TABLE public.quotes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL,
    service_type service_type NOT NULL DEFAULT 'genie_service',
    base_price numeric NOT NULL,
    service_fee numeric NOT NULL DEFAULT 0,
    lead_fee numeric NOT NULL DEFAULT 0,
    emergency_fee numeric NOT NULL DEFAULT 0,
    total_owner_price numeric NOT NULL,
    total_provider_receives numeric NOT NULL,
    is_emergency boolean NOT NULL DEFAULT false,
    status quote_status NOT NULL DEFAULT 'pending',
    notes text,
    valid_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Boat owners can view quotes for their work orders
CREATE POLICY "Owners can view quotes for their work orders"
ON public.quotes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM work_orders wo
        WHERE wo.id = quotes.work_order_id AND owns_boat(wo.boat_id)
    ) OR provider_id = auth.uid() OR is_admin()
);

-- Providers can create quotes
CREATE POLICY "Providers can create quotes"
ON public.quotes FOR INSERT
WITH CHECK (provider_id = auth.uid() OR is_admin());

-- Providers can update their own quotes, owners can accept/reject
CREATE POLICY "Providers and owners can update quotes"
ON public.quotes FOR UPDATE
USING (
    provider_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM work_orders wo
        WHERE wo.id = quotes.work_order_id AND owns_boat(wo.boat_id)
    ) OR is_admin()
);

-- Add escrow and pricing fields to work_orders
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS escrow_status escrow_status NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'genie_service',
ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS service_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS emergency_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_quote_id uuid REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS escrow_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS photos_uploaded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS funds_released_at timestamp with time zone;

-- Create view for boat_profiles that masks sensitive data for providers
CREATE OR REPLACE VIEW public.boat_profiles_masked AS
SELECT 
    bp.id,
    bp.boat_id,
    bp.marina_name,
    bp.marina_address,
    bp.special_instructions,
    bp.created_at,
    bp.updated_at,
    -- Only show slip_number and gate_code if:
    -- 1. User owns the boat, OR
    -- 2. User is admin, OR  
    -- 3. User is a provider with an accepted quote for this boat
    CASE 
        WHEN owns_boat(bp.boat_id) OR is_admin() OR EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.boat_id = bp.boat_id 
            AND wo.provider_id = auth.uid()
            AND wo.escrow_status IN ('approved', 'work_started', 'pending_photos', 'pending_release', 'released')
        )
        THEN bp.slip_number
        ELSE '••••••'
    END as slip_number,
    CASE 
        WHEN owns_boat(bp.boat_id) OR is_admin() OR EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.boat_id = bp.boat_id 
            AND wo.provider_id = auth.uid()
            AND wo.escrow_status IN ('approved', 'work_started', 'pending_photos', 'pending_release', 'released')
        )
        THEN bp.gate_code
        ELSE '••••••'
    END as gate_code
FROM public.boat_profiles bp;

-- Grant access to the view
GRANT SELECT ON public.boat_profiles_masked TO authenticated;

-- Insert default service rates
INSERT INTO public.service_rates (service_name, service_type, rate_per_foot, description) VALUES
('Hull Cleaning', 'genie_service', 3.50, 'Professional hull cleaning service'),
('Bottom Painting', 'genie_service', 12.00, 'Anti-fouling bottom paint application'),
('Wash & Wax', 'genie_service', 2.50, 'Complete exterior wash and wax'),
('Interior Detailing', 'genie_service', 4.00, 'Full interior cleaning and detailing'),
('Engine Service', 'pro_service', NULL, 'Engine diagnostics and maintenance');

UPDATE public.service_rates SET diagnostic_fee = 150 WHERE service_type = 'pro_service';

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_service_rates_updated_at
BEFORE UPDATE ON public.service_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();