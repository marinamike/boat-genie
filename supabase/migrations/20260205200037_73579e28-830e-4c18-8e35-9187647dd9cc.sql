-- Add fuel_type and tank_readings columns for product-centric reconciliation
ALTER TABLE fuel_reconciliations
ADD COLUMN fuel_type text,
ADD COLUMN tank_readings jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN fuel_reconciliations.fuel_type IS 'The fuel type being reconciled (Diesel, Gas, Premium)';
COMMENT ON COLUMN fuel_reconciliations.tank_readings IS 'Array of tank readings: [{tank_id, tank_name, theoretical_gallons, physical_gallons, discrepancy_gallons}]';