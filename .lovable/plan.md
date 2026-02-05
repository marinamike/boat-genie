
# Fix: Price Per Gallon Not Updating in Quick-Log Fuel Sale

## Problem
When you update prices in the **Pricing** tab, the **Quick-Log Fuel Sale** form doesn't reflect the new prices. You have to close and reopen the form (or refresh the page) to see updated pricing.

## Root Cause
The `QuickSaleForm` component creates its own instance of the `useFuelPricing` hook, which fetches price data when the component first loads. When prices are updated in the **Pricing** tab, that update only refreshes the Pricing tab's hook instance - the QuickSaleForm's data remains stale.

## Solution
Refresh the pricing data whenever the Quick-Log Fuel Sale sheet opens. This ensures staff always see the latest prices when recording a sale.

## Changes Required

### 1. Update QuickSaleForm.tsx

Add a `useEffect` that calls `refresh()` from the pricing hook whenever the sheet opens:

```typescript
const { getRetailPrice, getMemberPrice, prices, refresh } = useFuelPricing();

// Refresh prices when sheet opens
useEffect(() => {
  if (open) {
    refresh();
  }
}, [open, refresh]);
```

This ensures that:
- Every time a staff member opens the sale form, fresh prices are fetched from the database
- Any updates made in the Pricing tab are immediately reflected
- The form always shows current pricing without requiring a page refresh

## Files to Modify
- `src/components/fuel/QuickSaleForm.tsx`

## Testing
1. Go to the **Fuel** dashboard
2. Open the **Pricing** tab and update a fuel price
3. Click **Log Fuel Sale** to open the Quick-Log form
4. Select a pump with that fuel type
5. Verify the **Price Per Gallon** field shows the newly updated price
