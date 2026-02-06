
# Display Correct Utility Rates with Inheritance

## Problem
The Meters tab and Settings > Utility Meters section both display the individual meter's `rate_per_unit` value instead of showing the effective rate after applying the global business defaults. When you update global utility pricing, these displays don't reflect the change because they're reading directly from the meter record.

## Current Behavior
- **Meters tab**: Shows `$0.01/kWh` (meter's stored rate)
- **Settings > Utility Meters**: Shows `$0.15/kWh` (meter's stored rate)  
- **Checkout**: Correctly uses global rate ($0.15/kWh) with meter fallback

The disconnect: checkout calculates correctly, but the meter displays don't match.

## Desired Behavior (Allow Overrides)
Apply the same inheritance pattern used for slip rates:
1. Global business rate is the default
2. Individual meters can have optional custom overrides
3. UI displays the **effective rate** (global or custom) with clear indication

## Solution

### 1. Update MeterReadings.tsx (Meters Tab)
- Import `useBusiness` hook
- Calculate effective rate: `business?.power_rate_per_kwh ?? meter.rate_per_unit`
- Display effective rate instead of raw meter rate
- Optionally show "(Custom)" badge if meter has a non-null override

### 2. Update SlipSettings.tsx (Settings Tab > Utility Meters)
- Already imports `useBusiness`
- Update the meter card display to show effective rate
- When editing a meter, clarify that leaving rate empty uses global default

### 3. Update Meter Form Logic
- Allow clearing the rate field to "inherit" global rate
- Show helper text: "Leave empty to use global rate"

## Files to Modify

| File | Change |
|------|--------|
| `src/components/slips/MeterReadings.tsx` | Import useBusiness, display effective rate with inheritance |
| `src/components/slips/SlipSettings.tsx` | Display effective rate in meter cards with inheritance |

## UI Changes

### Meter Card (Meters Tab)
```text
Before:                          After:
+------------------------+       +------------------------+
| D20                    |       | D20                    |
| Rate: $0.01/kWh        |       | Rate: $0.15/kWh        | <- Uses global
+------------------------+       +------------------------+

                                 OR if meter has custom:
                                 +------------------------+
                                 | D20            [Custom]|
                                 | Rate: $0.20/kWh        | <- Custom override
                                 +------------------------+
```

### Recording Sheet
```text
+------------------------------------------+
| Previous Reading: 100 kWh                |
| Rate: $0.15/kWh (Global)    <- NEW label |
+------------------------------------------+
```

## Implementation Details

### Rate Inheritance Logic
```typescript
// For power meters:
const getEffectiveRate = (meter: UtilityMeter, business: Business | null) => {
  if (meter.meter_type === "power") {
    return meter.rate_per_unit !== null 
      ? meter.rate_per_unit 
      : (business?.power_rate_per_kwh ?? 0);
  } else {
    return meter.rate_per_unit !== null 
      ? meter.rate_per_unit 
      : (business?.water_rate_per_gallon ?? 0);
  }
};

const isCustomRate = (meter: UtilityMeter) => {
  return meter.rate_per_unit !== null && meter.rate_per_unit > 0;
};
```

### Key Consideration
Since meters currently store `rate_per_unit` as a non-nullable field, we need to decide on the inheritance signal:
- Option A: Treat `rate_per_unit = 0` as "use global" (simpler, no schema change)
- Option B: Make `rate_per_unit` nullable and treat `null` as "use global" (cleaner but requires migration)

**Recommended: Option A** - Use 0 as the "inherit global" signal to avoid schema changes. Display logic:
```typescript
const effectiveRate = meter.rate_per_unit > 0 
  ? meter.rate_per_unit  // Custom rate
  : (business?.power_rate_per_kwh ?? 0);  // Global rate
```
