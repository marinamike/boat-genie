-- Add 'per_hour' to the pricing_model enum
ALTER TYPE public.pricing_model ADD VALUE IF NOT EXISTS 'per_hour';