
# Add Pump Totalizer to Tank Reconciliation

## Overview
During tank reconciliation, staff need to record pump totalizer readings (the cumulative gallons displayed on each pump's meter). This allows comparing:
- **Tank level** (physical dip vs theoretical from deliveries - sales)
- **Pump totalizers** (actual meter reading vs system's lifetime meter)

## Database Changes

Add columns to the `fuel_reconciliations` table to store pump totalizer data:

```sql
ALTER TABLE fuel_reconciliations
ADD COLUMN pump_totalizer_readings jsonb DEFAULT '[]'::jsonb;
```

This stores an array of pump readings:
```json
[
  { "pump_id": "uuid", "pump_name": "Pump 1", "meter_reading": 12500.5, "expected_reading": 12450.0 }
]
```

## UI Changes

### ReconciliationForm.tsx

1. **Add pump props** - Pass pumps list to the form
2. **Filter pumps by fuel type** - When a tank is selected, show pumps that match that tank's fuel type
3. **Add pump totalizer input section** - For each matching pump, show:
   - Pump name
   - Current system meter reading (lifetime_meter_gallons)
   - Input field for actual totalizer reading
4. **Calculate pump discrepancy** - Show difference between entered totalizer and system value

### Form Layout Addition

After the physical tank reading section, add:

```
┌─────────────────────────────────────────┐
│ Pump Totalizers (Diesel)                │
├─────────────────────────────────────────┤
│ Pump 1                                  │
│   System Reading: 12,450 gal            │
│   Actual Reading: [__________] gal      │
│   Discrepancy: +50 gal                  │
├─────────────────────────────────────────┤
│ Pump 2                                  │
│   System Reading: 8,320 gal             │
│   Actual Reading: [__________] gal      │
│   Discrepancy: +15 gal                  │
└─────────────────────────────────────────┘
```

## Files to Modify

1. **Database migration** - Add `pump_totalizer_readings` column
2. **`src/hooks/useFuelManagement.ts`** - Update `FuelReconciliation` interface and `recordReconciliation` function
3. **`src/components/fuel/ReconciliationForm.tsx`** - Add pump totalizer inputs
4. **`src/pages/FuelDashboard.tsx`** - Pass pumps to ReconciliationForm

## Technical Details

### Interface Update
```typescript
export interface FuelReconciliation {
  // ... existing fields
  pump_totalizer_readings: Array<{
    pump_id: string;
    pump_name: string;
    meter_reading: number;
    expected_reading: number;
  }> | null;
}
```

### Form Props Update
```typescript
interface ReconciliationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  pumps: FuelPump[];  // NEW
  onRecordReconciliation: (data: {
    tank_id: string;
    physical_reading_gallons: number;
    measurement_type: "gallons" | "inches";
    raw_measurement?: number;
    pump_totalizer_readings?: Array<{...}>;  // NEW
    notes?: string;
  }) => Promise<unknown>;
}
```
