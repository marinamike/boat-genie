
# Fix: Rate Inheritance for Checkout Billing

## Problem Identified
When checking out a vessel, the final bill shows $0.00 because:
1. Individual slips have `null` rate values (they're meant to inherit from business defaults)
2. The CheckoutBillingSheet only reads rates from the slip itself
3. The fallback `|| 0` treats null as "no rate" instead of "use business default"

Database shows:
- **Business rates**: $2.50/ft daily, $15/ft weekly, $45/ft monthly (correctly saved)
- **Slip rates**: All null (expected - should inherit)
- **Checkout calculation**: Uses 0 instead of inheriting

## Solution
Modify `CheckoutBillingSheet.tsx` to implement proper rate inheritance:
1. Import and use the `useBusiness` context to access global rates
2. Apply inheritance logic: use slip rate if set, otherwise fall back to business default

## Files to Modify

| File | Change |
|------|--------|
| `src/components/slips/CheckoutBillingSheet.tsx` | Add business context and implement rate inheritance fallback |

## Implementation Details

### Update CheckoutBillingSheet.tsx

Add business context import and modify the rate calculation:

```typescript
import { useBusiness } from "@/contexts/BusinessContext";

// Inside the component:
const { business } = useBusiness();

// Rate calculation with inheritance
const rates: StayRates = {
  daily_rate_per_ft: slipAsset.daily_rate_per_ft ?? business?.default_daily_rate_per_ft ?? 0,
  weekly_rate_per_ft: slipAsset.weekly_rate_per_ft ?? business?.default_weekly_rate_per_ft ?? 0,
  monthly_rate_per_ft: slipAsset.monthly_rate_per_ft ?? business?.default_monthly_rate_per_ft ?? 0,
  seasonal_rate_per_ft: slipAsset.seasonal_rate_per_ft ?? business?.default_seasonal_rate_per_ft ?? 0,
  annual_rate_per_ft: slipAsset.annual_rate_per_ft ?? business?.default_annual_rate_per_ft ?? 0,
};
```

### Key Change: `??` vs `||`
- Using `??` (nullish coalescing) only falls back when the value is `null` or `undefined`
- Using `||` falls back on any falsy value (including 0, which could be a legitimate rate)

## Expected Result After Fix
For a 53ft vessel staying 1 day at D20:
- Daily rate per foot: $2.50 (from business defaults)
- Calculation: $2.50 x 1 day x 53ft = **$132.50**

Plus any utility charges based on meter readings.
