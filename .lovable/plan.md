

## Plan: Rewrite PendingQuotesSection fetch and action logic

### Summary
Rewrite the fetch to go boats → work_orders → quotes with business names. Simplify price display to base price + materials deposit only. Fix accept to decline sibling quotes via wish_form_id. Fix decline to only update the quote (wish stays open).

### Changes (single file: `src/components/owner/PendingQuotesSection.tsx`)

**1. Interface update**
- Remove `service_fee` and `total_owner_price` from `PendingQuote`
- Add `wish_form_id: string | null` to the work_order sub-interface

**2. Fetch logic** (stays the same pattern: boats → work orders → quotes → businesses)
- Add `wish_form_id` to the work_order select query
- No functional change needed — already filters by boat_id on work_orders, then quotes by work_order_id with status "pending"

**3. Accept handler rewrite**
- Update quote status to `"accepted"`
- Update work order: `status: "assigned"`, `accepted_quote_id`, `owner_approved_at`, `escrow_status: "work_started"`, `escrow_amount: quote.base_price + (quote.materials_deposit || 0)`
- Look up `wish_form_id` from work order → update wish to `"accepted"`
- **Decline all other pending quotes on the same wish**: query work_orders with matching `wish_form_id`, get their IDs, update all quotes on those work orders (excluding the accepted one) to `"declined"`

**4. Decline handler rewrite**
- Update quote status to `"declined"` — **that's it**
- Remove the work order cancellation and wish closure logic entirely
- Update toast message to "The wish remains open for other providers"

**5. Price display simplification**
- Remove "Platform Fee (10%)" row
- Remove "Service Cost" label → show "Base Price"
- Total = `base_price + (materials_deposit || 0)` computed inline
- Remove `Separator` import if unused

