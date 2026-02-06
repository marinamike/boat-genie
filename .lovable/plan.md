

# Fix Mid-Month Meter Reading Rate Inheritance

## Problem Identified

The Mid-Month Meter Reading sheet has the same rate inheritance bug we fixed in the checkout billing. It displays and calculates using raw meter rates instead of applying the inheritance pattern:
- If `meter.rate_per_unit > 0`: use the custom meter rate
- Otherwise: fall back to global business rate (`power_rate_per_kwh` or `water_rate_per_gallon`)

## Current Behavior

```text
Rate: $0.00/kWh   <-- Shows raw meter rate (0 means inheriting)
Usage: 50.00 kWh = $0.00   <-- Calculates using $0.00 rate
```

## Expected Behavior

```text
Rate: $0.15/kWh   <-- Shows effective rate (inherited from global)
Usage: 50.00 kWh = $7.50   <-- Calculates using $0.15 rate
```

## Files to Modify

### 1. `src/components/slips/MidMonthMeterReadingSheet.tsx`

**Changes:**

1. Import `useBusiness` hook to access global rates
2. Add `useMemo` hooks to calculate effective rates with inheritance logic
3. Update rate display (lines 198, 246) to show effective rates
4. Update usage calculations (lines 227-229, 275-277) to use effective rates
5. Add "(Custom)" label when meter has an override rate

### 2. `src/hooks/useRecurringBilling.ts`

**Changes:**

Update the `generateMonthlyInvoice` function (line 111) to apply rate inheritance when calculating utility charges from meter readings.

## Implementation Details

### MidMonthMeterReadingSheet.tsx

Add imports and effective rate calculation:
```typescript
import { useBusiness } from "@/contexts/BusinessContext";
import { useMemo } from "react";

// Inside component:
const { business } = useBusiness();

const effectivePowerRate = useMemo(() => {
  if (!powerMeter) return 0;
  return powerMeter.rate_per_unit > 0 
    ? powerMeter.rate_per_unit 
    : (business?.power_rate_per_kwh ?? 0);
}, [powerMeter, business]);

const effectiveWaterRate = useMemo(() => {
  if (!waterMeter) return 0;
  return waterMeter.rate_per_unit > 0 
    ? waterMeter.rate_per_unit 
    : (business?.water_rate_per_gallon ?? 0);
}, [waterMeter, business]);
```

Update display (line 198):
```typescript
// Before:
Rate: {formatCurrency(powerMeter.rate_per_unit)}/kWh

// After:
Rate: {formatCurrency(effectivePowerRate)}/kWh
{powerMeter.rate_per_unit > 0 && <span className="ml-1 text-xs">(Custom)</span>}
```

Update calculation (lines 227-229):
```typescript
// Before:
{formatCurrency(usage * powerMeter.rate_per_unit)}

// After:
{formatCurrency(usage * effectivePowerRate)}
```

Same changes apply for water meter at lines 246 and 275-277.

### useRecurringBilling.ts

Update the `generateMonthlyInvoice` function to fetch business rates and apply inheritance:

```typescript
// Get business rates for inheritance
const powerGlobalRate = business?.power_rate_per_kwh ?? 0;
const waterGlobalRate = business?.water_rate_per_gallon ?? 0;

for (const reading of meterReadings) {
  const meter = meters.find(m => m.id === reading.meter_id);
  if (meter) {
    const usage = reading.reading_value;
    // Apply rate inheritance
    const effectiveRate = meter.rate_per_unit > 0 
      ? meter.rate_per_unit 
      : (meter.meter_type === "power" ? powerGlobalRate : waterGlobalRate);
    const total = usage * effectiveRate;
    // ... rest of logic
  }
}
```

## Summary of Changes

| File | Line(s) | Change |
|------|---------|--------|
| MidMonthMeterReadingSheet.tsx | Top imports | Add `useBusiness`, `useMemo` imports |
| MidMonthMeterReadingSheet.tsx | After line 63 | Add `business` from hook and `effectivePowerRate`/`effectiveWaterRate` memos |
| MidMonthMeterReadingSheet.tsx | Line 198 | Display `effectivePowerRate` with optional "(Custom)" label |
| MidMonthMeterReadingSheet.tsx | Lines 227-229 | Use `effectivePowerRate` in calculation |
| MidMonthMeterReadingSheet.tsx | Line 246 | Display `effectiveWaterRate` with optional "(Custom)" label |
| MidMonthMeterReadingSheet.tsx | Lines 275-277 | Use `effectiveWaterRate` in calculation |
| useRecurringBilling.ts | Lines 106-120 | Apply rate inheritance when calculating utility totals |

