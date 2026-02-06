
# Fix Checkout Billing: Display Correct Utility Rates and Add Subtotal

## Problems Identified

### 1. Utility Rate Display Shows Raw Meter Rate
In the checkout billing sheet, the displayed rate under each meter shows:
```typescript
Rate: {formatCurrency(powerMeter.rate_per_unit)}/kWh  // Shows raw meter rate
```

But the calculation uses the correct inherited rate:
```typescript
const powerRatePerUnit = business?.power_rate_per_kwh ?? powerMeter?.rate_per_unit ?? 0;
```

This disconnect causes confusion - the display shows `$0.00/kWh` (or old stored rate) while the actual calculation uses the global rate.

### 2. Missing Utilities Subtotal
The billing breakdown shows:
- Stay Subtotal: $X.XX
- Individual meter charges
- Grand Total: $X.XX

But lacks a clear "Utilities Subtotal" line before the grand total.

## Solution

### File to Modify
`src/components/slips/CheckoutBillingSheet.tsx`

### Changes

#### 1. Display Effective Rate with Inheritance
Calculate effective rates in a useMemo and display those instead of raw meter rates:

```typescript
// Calculate effective rates with inheritance logic
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

Then update the display:
```typescript
// Before:
<p className="text-xs text-muted-foreground">
  Rate: {formatCurrency(powerMeter.rate_per_unit)}/kWh
</p>

// After:
<p className="text-xs text-muted-foreground">
  Rate: {formatCurrency(effectivePowerRate)}/kWh
  {powerMeter.rate_per_unit > 0 && <span className="ml-1">(Custom)</span>}
</p>
```

#### 2. Add Utilities Subtotal Section
After the utility meters section and before Grand Total, add:

```typescript
{/* Utilities Subtotal */}
{billing && billing.utilities.length > 0 && (
  <div className="p-4 rounded-lg border bg-muted/30">
    <div className="flex justify-between font-semibold">
      <span>Utilities Subtotal</span>
      <span>{formatCurrency(
        billing.utilities.reduce((sum, u) => sum + u.total, 0)
      )}</span>
    </div>
  </div>
)}
```

### UI After Changes

```text
+----------------------------------------+
| UTILITY READINGS                       |
+----------------------------------------+
| [Power Icon] D20 Power                 |
| Rate: $0.15/kWh                   <-- Fixed: shows effective rate
|                                        |
| Start Reading: [100]                   |
| End Reading:   [150]                   |
| Usage: 50.00 kWh           $7.50       |
+----------------------------------------+
| [Water Icon] D20 Water                 |
| Rate: $0.05/gal                   <-- Fixed: shows effective rate
|                                        |
| Start Reading: [200]                   |
| End Reading:   [250]                   |
| Usage: 50.00 gal           $2.50       |
+----------------------------------------+
|                                        |
| Utilities Subtotal            $10.00   | <-- NEW
|                                        |
+----------------------------------------+
| [Grand Total Box]             $XXX.XX  |
+----------------------------------------+
```

### Calculation Logic Update
Also need to fix the billing calculation to properly apply inheritance:

```typescript
// Current (correct for calculation, but need to also use in billing object):
const powerRatePerUnit = powerMeter?.rate_per_unit > 0 
  ? powerMeter.rate_per_unit 
  : (business?.power_rate_per_kwh ?? 0);

const waterRatePerUnit = waterMeter?.rate_per_unit > 0 
  ? waterMeter.rate_per_unit 
  : (business?.water_rate_per_gallon ?? 0);
```

The current logic at lines 113-114 prefers business rate over meter rate:
```typescript
const powerRatePerUnit = business?.power_rate_per_kwh ?? powerMeter?.rate_per_unit ?? 0;
```

This should be changed to respect the custom override pattern (meter rate > 0 means custom):
```typescript
const powerRatePerUnit = powerMeter?.rate_per_unit && powerMeter.rate_per_unit > 0 
  ? powerMeter.rate_per_unit 
  : (business?.power_rate_per_kwh ?? 0);
```

## Summary of Changes

| Location | Change |
|----------|--------|
| Lines 68-80 | Add `effectivePowerRate` and `effectiveWaterRate` useMemo hooks |
| Lines 113-114 | Update rate calculation to use inheritance pattern (meter > 0 ? meter : global) |
| Line 302-303 | Display `effectivePowerRate` with optional "(Custom)" label |
| Line 352-353 | Display `effectiveWaterRate` with optional "(Custom)" label |
| After line 394 | Add "Utilities Subtotal" section with calculated total |
