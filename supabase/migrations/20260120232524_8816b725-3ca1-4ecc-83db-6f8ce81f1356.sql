-- Create enum for launch queue status
CREATE TYPE public.launch_status AS ENUM ('queued', 'on_deck', 'splashing', 'splashed', 'in_water', 'hauling', 're_racked', 'cancelled');

-- Create enum for launch mode
CREATE TYPE public.launch_mode AS ENUM ('live_queue', 'scheduled_windows');

-- Add launch mode to marina settings
ALTER TABLE public.marina_settings
ADD COLUMN IF NOT EXISTS launch_mode launch_mode NOT NULL DEFAULT 'live_queue',
ADD COLUMN IF NOT EXISTS stale_timeout_minutes integer NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS re_rack_fee numeric NOT NULL DEFAULT 50.00;

-- Create launch queue table
CREATE TABLE public.launch_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL,
    slip_id uuid REFERENCES public.marina_slips(id) ON DELETE SET NULL,
    status launch_status NOT NULL DEFAULT 'queued',
    queue_position integer,
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    scheduled_time timestamp with time zone,
    eta timestamp with time zone,
    on_deck_at timestamp with time zone,
    splashed_at timestamp with time zone,
    checked_in_at timestamp with time zone,
    hauled_at timestamp with time zone,
    is_stale boolean NOT NULL DEFAULT false,
    stale_flagged_at timestamp with time zone,
    re_rack_fee_charged boolean NOT NULL DEFAULT false,
    re_rack_fee_charged_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.launch_queue ENABLE ROW LEVEL SECURITY;

-- Admins and providers can manage queue
CREATE POLICY "Staff can manage launch queue"
ON public.launch_queue FOR ALL
USING (is_admin() OR has_role(auth.uid(), 'provider'));

-- Owners can view their own queue entries
CREATE POLICY "Owners can view their queue entries"
ON public.launch_queue FOR SELECT
USING (owner_id = auth.uid());

-- Create public queue view (masked data)
CREATE VIEW public.launch_queue_public
WITH (security_invoker = on) AS
SELECT 
    lq.id,
    lq.status,
    lq.queue_position,
    lq.requested_at,
    lq.scheduled_time,
    lq.on_deck_at,
    lq.splashed_at,
    -- Mask boat details - only show type (make)
    b.make as boat_type,
    -- Show if it's user's own boat
    CASE WHEN lq.owner_id = auth.uid() THEN b.name ELSE NULL END as boat_name,
    CASE WHEN lq.owner_id = auth.uid() THEN true ELSE false END as is_own_boat
FROM public.launch_queue lq
JOIN public.boats b ON b.id = lq.boat_id
WHERE lq.status IN ('queued', 'on_deck', 'splashing', 'splashed', 'in_water')
ORDER BY lq.queue_position NULLS LAST, lq.requested_at;

GRANT SELECT ON public.launch_queue_public TO authenticated;

-- Create launch cards table (digital inspection form)
CREATE TABLE public.launch_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    launch_queue_id uuid NOT NULL REFERENCES public.launch_queue(id) ON DELETE CASCADE,
    boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
    operator_id uuid NOT NULL,
    operation_type text NOT NULL DEFAULT 'haul_out', -- 'launch' or 'haul_out'
    
    -- Inspection toggles
    visual_inspection_passed boolean NOT NULL DEFAULT false,
    engine_flush_confirmed boolean NOT NULL DEFAULT false,
    battery_off_confirmed boolean NOT NULL DEFAULT false,
    
    -- Additional fields
    damage_notes text,
    fuel_level text,
    additional_notes text,
    
    -- Timestamps for liability tracking
    inspection_started_at timestamp with time zone NOT NULL DEFAULT now(),
    inspection_completed_at timestamp with time zone,
    
    -- Auto-generated boat log reference
    boat_log_id uuid REFERENCES public.boat_logs(id),
    
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.launch_cards ENABLE ROW LEVEL SECURITY;

-- Staff can create and view launch cards
CREATE POLICY "Staff can manage launch cards"
ON public.launch_cards FOR ALL
USING (is_admin() OR has_role(auth.uid(), 'provider') OR operator_id = auth.uid());

-- Owners can view their boat's launch cards
CREATE POLICY "Owners can view their boat launch cards"
ON public.launch_cards FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM boats WHERE boats.id = launch_cards.boat_id AND boats.owner_id = auth.uid()
    )
);

-- Create re-rack fees table for tracking charges
CREATE TABLE public.re_rack_fees (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    launch_queue_id uuid NOT NULL REFERENCES public.launch_queue(id) ON DELETE CASCADE,
    boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL,
    charged_by uuid NOT NULL,
    amount numeric NOT NULL DEFAULT 50.00,
    reason text NOT NULL DEFAULT 'No-show: boat not checked in within timeout period',
    charged_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.re_rack_fees ENABLE ROW LEVEL SECURITY;

-- Admins can manage fees
CREATE POLICY "Admins can manage re-rack fees"
ON public.re_rack_fees FOR ALL
USING (is_admin());

-- Owners can view their fees
CREATE POLICY "Owners can view their fees"
ON public.re_rack_fees FOR SELECT
USING (owner_id = auth.uid());

-- Add triggers
CREATE TRIGGER update_launch_queue_updated_at
BEFORE UPDATE ON public.launch_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();