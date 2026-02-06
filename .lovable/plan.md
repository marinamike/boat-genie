
# Automatic Meter Reading Sync Plan

## Overview
This plan implements automatic meter reading synchronization:
1. When a meter reading is recorded during checkout, the value updates the meter's `current_reading` in `utility_meters`
2. When checking in a vessel, the starting meter readings are pre-populated based on the last recorded values from `utility_meters`

## Current State Analysis
- **Checkout Flow**: `CheckoutBillingSheet.tsx` collects meter end readings and creates an invoice via `useStayBilling.createInvoice()`, but does NOT update `utility_meters.current_reading`
- **Check-in Flow**: `useLiveDockStatus.checkInBoat()` creates a `dock_status` record but does NOT interact with meters
- **Meter Data**: `utility_meters` table has `current_reading` and `last_reading_date` columns that should track the latest values
- **Existing Pattern**: `useYardAssets.recordMeterReading()` already updates `utility_meters.current_reading` after recording - we can follow this pattern

## Implementation Steps

### Step 1: Update Checkout to Sync Meter Readings
Modify `useStayBilling.ts` to update `utility_meters.current_reading` after creating an invoice.

**File**: `src/hooks/useStayBilling.ts`
- In the `createInvoice` function, after inserting the invoice, update the relevant meters' `current_reading` values with the checkout end readings
- Also update `last_reading_date` to track when the reading was taken

### Step 2: Pre-populate Starting Readings in Checkout UI  
Modify `CheckoutBillingSheet.tsx` to use the meter's `current_reading` as the starting value (already doing this - verify it works correctly).

**File**: `src/components/slips/CheckoutBillingSheet.tsx`
- The component already uses `powerMeter.current_reading` and `waterMeter.current_reading` as the start values (lines 111, 120)
- These values will now always reflect the previous checkout's end reading

### Step 3: Add Starting Meter Confirmation at Check-In
Create a check-in confirmation dialog that shows the expected starting meter readings (based on `utility_meters.current_reading`) and allows staff to confirm or adjust them.

**File**: `src/components/marina/ReservationManager.tsx`
- Update the check-in dialog to display current meter readings for the assigned slip
- Allow optional adjustment if the physical meter differs from system value
- If adjusted, update `utility_meters.current_reading` before completing check-in

### Step 4: Update Check-In Flow to Record Starting Readings
Modify `useLiveDockStatus.ts` to optionally accept meter reading values and update them during check-in.

**File**: `src/hooks/useLiveDockStatus.ts`
- Extend `checkInBoat()` to accept optional meter reading params
- If provided (and different from current), update `utility_meters.current_reading`

## Data Flow Summary

```text
+------------------+     +-----------------+     +------------------+
|    CHECK-OUT     |     | utility_meters  |     |    CHECK-IN      |
|                  |     |                 |     |                  |
| Enter end reading|---->| current_reading |---->| Show as "start"  |
| (e.g., 150 kWh)  |     | = 150           |     | Confirm or adjust|
+------------------+     +-----------------+     +------------------+
```

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useStayBilling.ts` | Add meter update after invoice creation |
| `src/components/marina/ReservationManager.tsx` | Show meter readings in check-in dialog with confirmation |
| `src/hooks/useLiveDockStatus.ts` | Accept optional meter adjustments during check-in |

## Technical Details

### Meter Update Logic (Checkout)
```typescript
// After creating invoice, update meters
if (powerMeter && powerEndReading > 0) {
  await supabase
    .from("utility_meters")
    .update({
      current_reading: powerEndReading,
      last_reading_date: new Date().toISOString(),
    })
    .eq("id", powerMeter.id);
}
```

### Check-In Meter Display
- Fetch meters for the assigned slip via `yard_asset_id`
- Display: "Power Meter: 150 kWh (last read: Feb 6, 2026)"
- Staff confirms values match physical meters before completing check-in

## Edge Cases Handled
1. **No meters assigned to slip**: Skip meter logic entirely (already handled)
2. **Meter reading lower than current**: Allow (rollover or reset scenarios)
3. **Walk-in without reservation**: Still shows meter confirmation based on slip assignment
4. **Multiple vessels using same slip**: Each checkout updates the reading, so next check-in gets correct starting value
