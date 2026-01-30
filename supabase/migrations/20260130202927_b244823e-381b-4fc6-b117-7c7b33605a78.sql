-- Add estimated arrival time column to work_orders for providers to specify when they'll arrive
ALTER TABLE public.work_orders 
ADD COLUMN estimated_arrival_time TEXT;