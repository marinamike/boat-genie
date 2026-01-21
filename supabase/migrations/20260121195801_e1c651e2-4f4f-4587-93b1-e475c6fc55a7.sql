-- Add provider_initiated flag and awaiting_owner_approval status support to work_orders
-- Also create a pending_invites table for tracking new customer invitations

-- Create pending_invites table for new customer invitations
CREATE TABLE public.pending_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  boat_length_ft NUMERIC,
  work_order_id UUID,
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Policies for pending_invites
CREATE POLICY "Providers can view their own invites"
  ON public.pending_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles pp 
      WHERE pp.id = pending_invites.provider_id 
      AND pp.user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Providers can create invites"
  ON public.pending_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_profiles pp 
      WHERE pp.id = pending_invites.provider_id 
      AND pp.user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Providers can update their invites"
  ON public.pending_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles pp 
      WHERE pp.id = pending_invites.provider_id 
      AND pp.user_id = auth.uid()
    ) OR is_admin()
  );

-- Add columns to work_orders for provider-initiated flow
ALTER TABLE public.work_orders 
  ADD COLUMN IF NOT EXISTS provider_initiated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_invite_id UUID REFERENCES public.pending_invites(id),
  ADD COLUMN IF NOT EXISTS owner_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS provider_service_id UUID REFERENCES public.provider_services(id);

-- Create trigger for updated_at on pending_invites
CREATE TRIGGER update_pending_invites_updated_at
  BEFORE UPDATE ON public.pending_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();