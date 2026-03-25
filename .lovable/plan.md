

## Plan: Remove fees from manually created work orders

### Summary
When a business creates a work order manually via `CreateWorkOrderDialog`, no platform fees (service fee or lead fee) should apply. The customer pays the base price + materials only.

### Changes

**1. `src/hooks/useProviderWorkOrder.ts` — `calculateQuote` function (lines 181-215)**
- Set `serviceFee = 0` and `leadFee = 0`
- `totalOwnerPrice = basePrice + materialsDeposit`
- `totalProviderReceives = basePrice`
- Remove the `PRICING_CONSTANTS` import if no longer used

**2. `src/components/provider/CreateWorkOrderDialog.tsx` — Quote display (lines 588-613)**
- Remove the "Service Fee (5%)" line (lines 594-597)
- Remove the "You Receive (after 5% lead fee)" line (lines 609-612)
- Keep: Base Price, Materials Deposit (conditional), and "Customer Pays" total

### Technical Detail
- The `WorkOrderQuote` interface keeps `serviceFee` and `leadFee` fields (set to 0) to avoid breaking the insert logic that writes these columns to `work_orders` and `quotes` tables — they'll simply store 0
- Platform fees remain in `src/lib/pricing.ts` for marketplace-initiated jobs (wishes/leads); this change only affects business-initiated manual work orders

