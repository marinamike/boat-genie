-- Add global slip rate defaults to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS default_daily_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_weekly_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_monthly_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_seasonal_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_annual_rate_per_ft numeric;