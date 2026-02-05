
# Auto-Update Cost Basis on Delivery Confirmation

## Overview
When a fuel delivery is confirmed with a cost per gallon, automatically update the cost basis for that product type in the pricing system. This ensures pricing always reflects the latest acquisition cost and maintains proper margins.

## Current Flow
1. Staff confirms a delivery with `gallons_delivered` and `cost_per_gallon`
2. System updates the delivery record and tank volume
3. Cost basis in pricing remains unchanged (requires manual update)

## Proposed Flow
1. Staff confirms delivery with `gallons_delivered` and `cost_per_gallon`
2. System updates delivery record and tank volume
3. **NEW**: System automatically updates `fuel_prices.cost_basis` for that fuel type
4. If auto-margin is enabled, retail price also updates automatically

## Changes Required

### 1. Update `useFuelManagement.ts` - `confirmDelivery` function
After updating the tank volume, add logic to update the fuel pricing cost basis:
- Look up the tank to determine the fuel type
- Update `fuel_prices.cost_basis` for that fuel type with the delivery's cost per gallon
- The existing database trigger will log the price change to history
- The existing auto-margin logic in the database/hook will recalculate retail price if enabled

### 2. Considerations
- Only update cost basis if `cost_per_gallon` is provided (not null/undefined)
- Use the tank's `fuel_type` to identify which pricing record to update
- The existing `log_fuel_price_change` trigger will automatically log the change to `fuel_price_history`
- If auto-margin is enabled, the retail price will be recalculated

---

## Technical Details

### File: `src/hooks/useFuelManagement.ts`
Location: Inside `confirmDelivery` function, after the tank volume update (around line 523)

Add the following logic:
1. Check if `cost_per_gallon` was provided
2. Get the fuel type from the tank
3. Get current price record for that fuel type
4. Calculate new retail price if auto-margin is enabled
5. Update the `fuel_prices` table with new cost basis (and retail price if auto-margin)
6. Set `updated_by` to current user for audit trail

The update will include:
- `cost_basis`: New cost from delivery
- `retail_price`: Recalculated if auto-margin enabled (cost_basis + auto_margin_amount)
- `member_price`: Recalculated if member discount enabled (retail_price - member_discount_amount)
- `updated_by`: Current user ID
