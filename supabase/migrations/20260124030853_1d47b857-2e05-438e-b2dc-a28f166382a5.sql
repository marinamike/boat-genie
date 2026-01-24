
-- Marina Reservations table for transient and long-term stays
CREATE TABLE public.marina_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marina_id UUID REFERENCES public.marinas(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  stay_type TEXT NOT NULL CHECK (stay_type IN ('transient', 'monthly', 'seasonal', 'annual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in', 'checked_out', 'cancelled')),
  requested_arrival DATE NOT NULL,
  requested_departure DATE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  actual_departure TIMESTAMP WITH TIME ZONE,
  assigned_slip TEXT,
  assigned_dock_location TEXT,
  power_requirements TEXT,
  special_requests TEXT,
  insurance_verified BOOLEAN DEFAULT false,
  registration_verified BOOLEAN DEFAULT false,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marina_reservations ENABLE ROW LEVEL SECURITY;

-- Owners can view their own reservations
CREATE POLICY "Owners can view their own reservations"
ON public.marina_reservations
FOR SELECT
USING (auth.uid() = owner_id);

-- Owners can create reservations
CREATE POLICY "Owners can create reservations"
ON public.marina_reservations
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their pending reservations
CREATE POLICY "Owners can update pending reservations"
ON public.marina_reservations
FOR UPDATE
USING (auth.uid() = owner_id AND status = 'pending');

-- Marina staff/admin can manage all reservations
CREATE POLICY "Admin can manage all reservations"
ON public.marina_reservations
FOR ALL
USING (public.is_admin() OR public.is_marina_manager());

-- Dock Status tracking for "Who's on Site" watchtower
CREATE TABLE public.dock_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marina_id UUID REFERENCES public.marinas(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  slip_number TEXT,
  reservation_id UUID REFERENCES public.marina_reservations(id) ON DELETE SET NULL,
  stay_type TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dock_status ENABLE ROW LEVEL SECURITY;

-- Everyone can view dock status (for discovery)
CREATE POLICY "Anyone can view dock status"
ON public.dock_status
FOR SELECT
USING (true);

-- Admin/marina staff can manage dock status
CREATE POLICY "Admin can manage dock status"
ON public.dock_status
FOR ALL
USING (public.is_admin() OR public.is_marina_manager());

-- Active work orders on dock (linking providers to boats on site)
CREATE TABLE public.dock_work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dock_status_id UUID NOT NULL REFERENCES public.dock_status(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  provider_name TEXT,
  service_type TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dock_work_orders ENABLE ROW LEVEL SECURITY;

-- Marina staff can view dock work orders
CREATE POLICY "Marina staff can view dock work orders"
ON public.dock_work_orders
FOR SELECT
USING (public.is_admin() OR public.is_marina_manager());

-- System can manage dock work orders
CREATE POLICY "Admin can manage dock work orders"
ON public.dock_work_orders
FOR ALL
USING (public.is_admin());

-- Anonymized marina leads for unclaimed marinas
CREATE TABLE public.marina_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marina_id UUID REFERENCES public.marinas(id) ON DELETE CASCADE,
  marina_name TEXT NOT NULL,
  marina_email TEXT,
  vessel_type TEXT NOT NULL,
  vessel_length_ft NUMERIC,
  vessel_beam_ft NUMERIC,
  vessel_draft_ft NUMERIC,
  power_requirements TEXT,
  requested_dates TEXT,
  stay_type TEXT,
  lead_status TEXT NOT NULL DEFAULT 'pending' CHECK (lead_status IN ('pending', 'sent', 'claimed', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marina_leads ENABLE ROW LEVEL SECURITY;

-- Only admin can view/manage leads
CREATE POLICY "Admin can manage marina leads"
ON public.marina_leads
FOR ALL
USING (public.is_admin());

-- Marina compatibility specs (for soft filter warnings)
ALTER TABLE public.marinas 
ADD COLUMN IF NOT EXISTS max_length_ft NUMERIC,
ADD COLUMN IF NOT EXISTS max_beam_ft NUMERIC,
ADD COLUMN IF NOT EXISTS max_draft_ft NUMERIC,
ADD COLUMN IF NOT EXISTS min_depth_ft NUMERIC,
ADD COLUMN IF NOT EXISTS power_options TEXT[],
ADD COLUMN IF NOT EXISTS accepts_transient BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_longterm BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS amenities_list TEXT[];

-- Enable realtime for dock_status and dock_work_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.dock_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dock_work_orders;

-- Trigger for updated_at on marina_reservations
CREATE TRIGGER update_marina_reservations_updated_at
BEFORE UPDATE ON public.marina_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on dock_status
CREATE TRIGGER update_dock_status_updated_at
BEFORE UPDATE ON public.dock_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
