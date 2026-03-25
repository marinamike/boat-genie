
-- Add approval_token and approved_at columns to work_orders
ALTER TABLE public.work_orders ADD COLUMN approval_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.work_orders ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
