-- Update yard_assets to use per-foot billing model with all rate types
ALTER TABLE public.yard_assets 
  DROP COLUMN IF EXISTS daily_rate,
  DROP COLUMN IF EXISTS monthly_rate;

ALTER TABLE public.yard_assets
  ADD COLUMN daily_rate_per_ft NUMERIC,
  ADD COLUMN weekly_rate_per_ft NUMERIC,
  ADD COLUMN monthly_rate_per_ft NUMERIC,
  ADD COLUMN seasonal_rate_per_ft NUMERIC,
  ADD COLUMN annual_rate_per_ft NUMERIC;

COMMENT ON COLUMN public.yard_assets.daily_rate_per_ft IS 'Daily rate per linear foot';
COMMENT ON COLUMN public.yard_assets.weekly_rate_per_ft IS 'Weekly rate per linear foot';
COMMENT ON COLUMN public.yard_assets.monthly_rate_per_ft IS 'Monthly rate per linear foot';
COMMENT ON COLUMN public.yard_assets.seasonal_rate_per_ft IS 'Seasonal rate per linear foot (typically 6 months)';
COMMENT ON COLUMN public.yard_assets.annual_rate_per_ft IS 'Annual rate per linear foot';