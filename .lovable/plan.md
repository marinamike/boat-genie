
# Refactor: Product-Centric Reconciliation

## Current Problem
The reconciliation form is **tank-centric** - you select ONE tank and see pumps matching that tank's fuel type. This doesn't match the real-world workflow where:
- All diesel tanks are reconciled together
- All diesel pumps are reconciled together
- Staff do reconciliation by **fuel type/product**, not by individual tank

## New Workflow
1. **Select Fuel Type** (Diesel, Gasoline, Premium)
2. **Tank Readings Section**: All active tanks of that fuel type are listed, each with:
   - Tank name
   - Theoretical volume (from system)
   - Physical reading input field
   - Discrepancy calculation
3. **Pump Totalizers Section**: All active pumps of that fuel type are listed, each with:
   - Pump name
   - System meter reading (lifetime_meter_gallons)
   - Actual totalizer input field
   - Discrepancy calculation
4. **Summary**: Combined theoretical vs physical for all tanks

## Database Changes

### New Table Structure
Since we're now reconciling multiple tanks per record, we need to store tank readings as an array (similar to pump readings):

```sql
ALTER TABLE fuel_reconciliations
ADD COLUMN fuel_type text,
ADD COLUMN tank_readings jsonb DEFAULT '[]'::jsonb;
```

The existing `tank_id`, `physical_reading_gallons`, `theoretical_volume_gallons`, `discrepancy_gallons`, `discrepancy_percentage` columns will become **summary/aggregate** values or can be deprecated in favor of the new JSONB approach.

**Recommended approach**: Store all tank readings in `tank_readings` JSONB and compute aggregate discrepancy values:

```json
{
  "fuel_type": "diesel",
  "tank_readings": [
    { "tank_id": "uuid1", "tank_name": "Diesel Tank 1", "theoretical": 5000, "physical": 4950 },
    { "tank_id": "uuid2", "tank_name": "Diesel Tank 2", "theoretical": 3000, "physical": 3010 }
  ],
  "pump_totalizer_readings": [...],
  "total_theoretical": 8000,
  "total_physical": 7960,
  "total_discrepancy": -40
}
```

## UI Changes

### ReconciliationForm.tsx

**Before** (Tank-centric):
```text
┌─────────────────────────────────────┐
│ Select Tank: [Diesel Tank 1 ▼]     │
│ Theoretical: 5,000 gal              │
│ Physical Reading: [___________]     │
│ Pump Totalizers:                    │
│   - Pump 1: System 12,000 / Actual [___] │
└─────────────────────────────────────┘
```

**After** (Product-centric):
```text
┌─────────────────────────────────────┐
│ Select Fuel Type: [Diesel ▼]       │
├─────────────────────────────────────┤
│ TANK READINGS                       │
│                                     │
│ Diesel Tank 1                       │
│   Theoretical: 5,000 gal            │
│   Physical: [___________] gal       │
│   Discrepancy: +50 gal              │
│                                     │
│ Diesel Tank 2                       │
│   Theoretical: 3,000 gal            │
│   Physical: [___________] gal       │
│   Discrepancy: -10 gal              │
│                                     │
│ Combined: 8,000 → 8,040 (+40 gal)   │
├─────────────────────────────────────┤
│ PUMP TOTALIZERS                     │
│                                     │
│ Diesel Pump 1                       │
│   System: 12,450 gal                │
│   Actual: [___________] gal         │
│   Discrepancy: +15 gal              │
│                                     │
│ Diesel Pump 2                       │
│   System: 8,320 gal                 │
│   Actual: [___________] gal         │
│   Discrepancy: +5 gal               │
└─────────────────────────────────────┘
```

## Files to Modify

1. **Database migration** - Add `fuel_type` and `tank_readings` columns to `fuel_reconciliations`
2. **`src/hooks/useFuelManagement.ts`**:
   - Update `FuelReconciliation` interface
   - Add `TankReading` interface
   - Refactor `recordReconciliation` to accept fuel_type and array of tank readings
   - Update all tanks' volumes after reconciliation
3. **`src/components/fuel/ReconciliationForm.tsx`**:
   - Replace tank selector with fuel type selector
   - Add multi-tank reading inputs
   - Keep pump totalizer section (already implemented)
   - Add combined summary display
4. **`src/components/fuel/DiscrepancyReport.tsx`** - Update to display product-based reconciliations with multiple tanks

## Technical Details

### New Interfaces
```typescript
export interface TankReading {
  tank_id: string;
  tank_name: string;
  theoretical_gallons: number;
  physical_gallons: number;
  discrepancy_gallons: number;
}

export interface FuelReconciliation {
  id: string;
  business_id: string;
  fuel_type: string;
  tank_readings: TankReading[];
  pump_totalizer_readings: PumpTotalizerReading[];
  total_theoretical_gallons: number;
  total_physical_gallons: number;
  total_discrepancy_gallons: number;
  total_discrepancy_percentage: number;
  measurement_type: string;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
  // Legacy fields (kept for backward compat)
  tank_id: string;
  physical_reading_gallons: number;
  theoretical_volume_gallons: number;
  discrepancy_gallons: number;
  discrepancy_percentage: number;
}
```

### New Form Props
```typescript
interface ReconciliationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  pumps: FuelPump[];
  onRecordReconciliation: (data: {
    fuel_type: string;
    tank_readings: TankReading[];
    pump_totalizer_readings?: PumpTotalizerReading[];
    measurement_type: "gallons" | "inches";
    notes?: string;
  }) => Promise<unknown>;
}
```

## Summary of Changes
| Component | Change |
|-----------|--------|
| Database | Add `fuel_type`, `tank_readings` JSONB columns |
| ReconciliationForm | Fuel type selector → multi-tank + multi-pump inputs |
| useFuelManagement | Handle multiple tank updates per reconciliation |
| DiscrepancyReport | Display product-based reconciliation history |
