-- Add status and separate quantity fields for request/confirm workflow
ALTER TABLE public.fuel_deliveries 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS gallons_requested numeric,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid;

-- Migrate existing data: set gallons_requested = gallons_delivered for historical records
UPDATE public.fuel_deliveries 
SET gallons_requested = gallons_delivered, 
    status = 'delivered',
    confirmed_at = delivery_date,
    confirmed_by = recorded_by
WHERE gallons_requested IS NULL;

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_fuel_deliveries_status ON public.fuel_deliveries(business_id, status);