-- Add rate fields and locking mechanism to provider_profiles
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS rate_per_foot numeric,
ADD COLUMN IF NOT EXISTS diagnostic_fee numeric,
ADD COLUMN IF NOT EXISTS rates_locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rates_agreed boolean NOT NULL DEFAULT false;

-- Add provider rate snapshot fields to work_orders
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS provider_rate_per_foot numeric,
ADD COLUMN IF NOT EXISTS provider_diagnostic_fee numeric,
ADD COLUMN IF NOT EXISTS provider_hourly_rate numeric;

-- Add same snapshot fields to quotes table for quote-time pricing
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS provider_rate_per_foot numeric,
ADD COLUMN IF NOT EXISTS provider_diagnostic_fee numeric,
ADD COLUMN IF NOT EXISTS provider_hourly_rate numeric;