-- Add pump totalizer readings column to fuel_reconciliations
ALTER TABLE fuel_reconciliations
ADD COLUMN pump_totalizer_readings jsonb DEFAULT '[]'::jsonb;