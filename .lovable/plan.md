

## Plan: Update useJobBoard.ts filtering logic

### Changes (single file: `src/hooks/useJobBoard.ts`)

1. **Filter wishes by service menu categories** (after line 192): Apply the existing `matchesProviderService` function to `filteredWishes`, so only wishes matching the business's active `business_service_menu` categories appear in the leads feed. The matching logic and helper functions already exist in the file.

2. **Work orders: filter by `business_id`** (line 211): Change `.eq("provider_id", session.user.id)` to `.eq("business_id", businessProfile?.id)` — guard against null business profile.

3. **Quoted orders: filter by `business_id`** (line 228): Change `.eq("provider_id", session.user.id)` to `.eq("business_id", businessProfile?.id)` for the pending-quote lookup as well.

No other changes — wish status filter already uses `["open"]`, and quote submission already leaves the wish as `"open"`.

