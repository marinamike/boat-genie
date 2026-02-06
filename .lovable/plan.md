

# Move Stay Subtotal to Unified Summary Section

## Current Layout
The billing sheet currently shows:
1. Stay Charges section with details AND the Stay Subtotal inside it
2. Utility Readings section with meter inputs
3. Utilities Subtotal (separate box)
4. Grand Total

## Goal
Create a cleaner summary section where both subtotals appear together right before the Grand Total:
- Stay Charges section shows only the breakdown details (rate tier, rate per day, vessel length, days)
- Utility Readings section shows meter inputs and individual charges
- New unified summary section with Stay Subtotal + Utilities Subtotal together
- Grand Total

## Changes to Make

**File:** `src/components/slips/CheckoutBillingSheet.tsx`

### 1. Remove Stay Subtotal from Stay Charges section
Remove the Separator and subtotal lines (287-291) from inside the Stay Charges box, so it only shows the rate breakdown details.

### 2. Create unified Subtotals section
Replace the current "Utilities Subtotal" section with a combined subtotals section that shows both:

```text
+------------------------------------------+
| Stay Subtotal                   $150.00  |
| Utilities Subtotal               $10.00  |
+------------------------------------------+
| [Grand Total Box]              $160.00   |
+------------------------------------------+
```

### Visual Result

**Before:**
```text
STAY CHARGES
├─ Rate Tier: Daily
├─ Rate per Day: $2.00/ft
├─ Vessel Length: 30 ft
├─ Days: 1
└─ Stay Subtotal: $60.00  <-- Inside the box

UTILITY READINGS
├─ Power meter inputs
└─ Water meter inputs

Utilities Subtotal: $10.00  <-- Separate

Grand Total: $70.00
```

**After:**
```text
STAY CHARGES
├─ Rate Tier: Daily
├─ Rate per Day: $2.00/ft
├─ Vessel Length: 30 ft
└─ Days: 1  <-- No subtotal here

UTILITY READINGS
├─ Power meter inputs
└─ Water meter inputs

+---------------------------+
| Stay Subtotal:    $60.00  |  <-- Both together
| Utilities Subtotal: $10.00|
+---------------------------+

Grand Total: $70.00
```

## Technical Details

### Lines to modify in CheckoutBillingSheet.tsx:

1. **Lines 287-291**: Remove the Separator and Stay Subtotal from inside the Stay Charges box
2. **Lines 418-429**: Replace the Utilities Subtotal section with a combined summary showing both subtotals

The new combined section will always show Stay Subtotal (when billing exists), and conditionally show Utilities Subtotal only when there are utility charges.

