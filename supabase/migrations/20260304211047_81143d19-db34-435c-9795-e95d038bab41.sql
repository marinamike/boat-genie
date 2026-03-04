
ALTER TABLE public.businesses
ADD COLUMN cancellation_policy_message text,
ADD COLUMN cancellation_fee_percent numeric;
