-- Add materials deposit field to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS materials_deposit numeric DEFAULT 0;

-- Add QC and milestone payment fields to work_orders table
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS materials_deposit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS materials_deposit_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS materials_deposit_released_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS qc_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS qc_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS qc_verified_by uuid,
ADD COLUMN IF NOT EXISTS qc_verifier_name text,
ADD COLUMN IF NOT EXISTS qc_verifier_role text,
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS disputed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS disputed_by uuid;

-- Create QC checklist items table for itemized verification
CREATE TABLE IF NOT EXISTS public.qc_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  verifier_name text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on qc_checklist_items
ALTER TABLE public.qc_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for QC checklist items
-- Owners can view and verify their items
CREATE POLICY "Owners can view qc items for their work orders"
ON public.qc_checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN boats b ON b.id = wo.boat_id
    WHERE wo.id = qc_checklist_items.work_order_id
    AND b.owner_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Owners and admins can update qc items"
ON public.qc_checklist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN boats b ON b.id = wo.boat_id
    WHERE wo.id = qc_checklist_items.work_order_id
    AND b.owner_id = auth.uid()
  )
  OR is_admin()
);

-- Providers can view QC items for their work orders
CREATE POLICY "Providers can view qc items for their work orders"
ON public.qc_checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = qc_checklist_items.work_order_id
    AND wo.provider_id = auth.uid()
  )
);

-- Providers can create QC items when submitting for review
CREATE POLICY "Providers can create qc items"
ON public.qc_checklist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = qc_checklist_items.work_order_id
    AND wo.provider_id = auth.uid()
  )
  OR is_admin()
);

-- Admins can manage all QC items
CREATE POLICY "Admins can manage all qc items"
ON public.qc_checklist_items
FOR ALL
USING (is_admin());

-- Create QC audit log table for permanent history
CREATE TABLE IF NOT EXISTS public.qc_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  boat_id uuid NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'qc_requested', 'qc_verified', 'funds_released', 'dispute_filed', 'deposit_released'
  performed_by uuid NOT NULL,
  performer_name text,
  performer_email text,
  performer_role text, -- 'owner', 'admin', 'runner'
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on qc_audit_logs
ALTER TABLE public.qc_audit_logs ENABLE ROW LEVEL SECURITY;

-- Owners can view audit logs for their boats
CREATE POLICY "Owners can view audit logs for their boats"
ON public.qc_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM boats b
    WHERE b.id = qc_audit_logs.boat_id
    AND b.owner_id = auth.uid()
  )
  OR is_admin()
);

-- System can create audit logs (via authenticated users)
CREATE POLICY "Authenticated users can create audit logs"
ON public.qc_audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.qc_audit_logs
FOR SELECT
USING (is_admin());

-- Add 'runner' to app_role enum if not exists (for marina staff who can verify)
-- Note: runner is essentially marina_staff who can do QC
-- We'll use marina_staff role for runners