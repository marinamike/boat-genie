
# Refactor: Pump-to-Fuel-Type Architecture

## Current Problem
The system links each pump to a **specific tank** via `tank_id`. In reality:
- All **diesel pumps** draw from all available **diesel tanks**
- All **gas pumps** draw from all available **gas tanks**

This means pumps should be associated with a **fuel type**, not a specific tank.

## Solution Overview
1. Replace `tank_id` on pumps with `fuel_type`
2. When recording a sale, deduct gallons proportionally from all active tanks of that fuel type (or from the tank with the most fuel)
3. Update UI to select fuel type instead of a specific tank when adding/editing pumps

## Database Changes

### Migration: Modify `fuel_pumps` table
```sql
-- Add fuel_type column to pumps
ALTER TABLE fuel_pumps 
ADD COLUMN fuel_type text;

-- Populate fuel_type from existing linked tanks
UPDATE fuel_pumps 
SET fuel_type = (SELECT fuel_type FROM fuel_tanks WHERE id = fuel_pumps.tank_id);

-- Make fuel_type NOT NULL and remove tank_id requirement
ALTER TABLE fuel_pumps 
ALTER COLUMN fuel_type SET NOT NULL;

-- Make tank_id nullable (keep for historical reference but not used going forward)
ALTER TABLE fuel_pumps 
ALTER COLUMN tank_id DROP NOT NULL;
```

## Code Changes

### 1. Update `FuelPump` Interface
**File:** `src/hooks/useFuelManagement.ts`

- Add `fuel_type` field to the interface
- Remove dependency on `tank_id` for fuel type lookup

### 2. Update `PumpSetupForm.tsx`
**File:** `src/components/fuel/PumpSetupForm.tsx`

- Replace "Linked Tank" dropdown with **Fuel Type** selector (Gas, Diesel, Premium)
- Remove tank selection entirely

### 3. Update `recordSale` Logic
**File:** `src/hooks/useFuelManagement.ts`

Current logic:
```typescript
const tank = tanks.find(t => t.id === pump.tank_id);
// Deduct from single tank
```

New logic:
```typescript
// Find all active tanks of this fuel type
const matchingTanks = tanks.filter(t => 
  t.fuel_type === pump.fuel_type && t.is_active
);

// Deduct from tank with most fuel (or distribute proportionally)
const primaryTank = matchingTanks.sort((a, b) => 
  b.current_volume_gallons - a.current_volume_gallons
)[0];
```

### 4. Update `QuickSaleForm.tsx`
**File:** `src/components/fuel/QuickSaleForm.tsx`

- Update pump display to show fuel type directly instead of `pump.tank?.fuel_type`
- Update tank availability display to show combined volume across all tanks of that type

### 5. Update `fuel_transactions` Insert
When recording a sale, we'll pick the primary tank (with most volume) to associate with the transaction for inventory tracking purposes.

## Files to Modify
- **Database migration** (new)
- `src/hooks/useFuelManagement.ts` - Interface + sale logic
- `src/components/fuel/PumpSetupForm.tsx` - Fuel type selector
- `src/components/fuel/QuickSaleForm.tsx` - Display updates

## Testing
1. Edit an existing pump - verify fuel type is shown (not tank)
2. Add a new pump - select fuel type only
3. Record a sale - verify gallons are deducted from the correct fuel type's tanks
4. Check that combined tank volume displays correctly in the sale form
