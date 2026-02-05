-- Add fuel_type column to pumps
ALTER TABLE fuel_pumps 
ADD COLUMN fuel_type text;

-- Populate fuel_type from existing linked tanks
UPDATE fuel_pumps 
SET fuel_type = (SELECT fuel_type FROM fuel_tanks WHERE id = fuel_pumps.tank_id);

-- Set a default for any pumps without a tank link
UPDATE fuel_pumps 
SET fuel_type = 'Gas' WHERE fuel_type IS NULL;

-- Make fuel_type NOT NULL
ALTER TABLE fuel_pumps 
ALTER COLUMN fuel_type SET NOT NULL;

-- Make tank_id nullable (keep for historical reference but not used going forward)
ALTER TABLE fuel_pumps 
ALTER COLUMN tank_id DROP NOT NULL;