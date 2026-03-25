
ALTER TYPE public.work_order_status ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'pending';
ALTER TYPE public.work_order_status ADD VALUE IF NOT EXISTS 'approved' AFTER 'pending';
ALTER TYPE public.work_order_status ADD VALUE IF NOT EXISTS 'qc_review' AFTER 'in_progress';
