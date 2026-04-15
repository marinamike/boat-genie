

## Plan: Targeted Fixes — Dashboard, ServiceWorkOrders, EditWorkOrderSheet

### 1. `src/components/service/ServiceWorkOrders.tsx` — Add "disputed" to status filter

**Line 319**: Add `"disputed"` to the `.in("status", [...])` array. Currently missing — verified.

### 2. `src/pages/Dashboard.tsx` — Three changes

**fetchWishes (line 133)**: Change `.not("status", "eq", "closed")` to `.not("status", "in", '("closed","accepted")')` to hide accepted wishes from "My Wishes".

**"disputed" in fetchActiveJobs and statusMap**: Both are already present (line 155 and line 459) — verified in the code. No change needed.

**Active Jobs read-only detail sheet**: Add state `selectedJobDetail` and a `<Sheet>` component. Each Active Jobs card gets an `onClick` to open the sheet. The sheet shows: title, business name, boat name, status badge, scheduled date, and description (add `description` to the fetchActiveJobs select and the `ActiveJob` interface). The existing "Review Invoice" button moves inside the sheet for completed/disputed jobs — it calls the same `handleReviewInvoice` logic that sets `reviewingInvoiceId`, which will still work because `InvoiceReview` is rendered separately at page level.

### 3. `src/components/service/EditWorkOrderSheet.tsx` — Price change approval flow

**Owner ID access**: The `workOrder` prop interface already includes `boats?: { ..., owner_id: string }`, and the parent (`ServiceWorkOrders`) fetches `boats(name, make, model, owner_id)` in its query. So `workOrder.boats?.owner_id` is available — no additional fetch needed.

**Conditional save logic in `saveChanges`**: If `workOrder.status` is one of `["assigned", "in_progress", "qc_review"]` AND the price has changed from the current `retail_price`:
- Update `proposed_retail_price` to the new price instead of `retail_price`
- Set `status` to `"pending_approval"`
- Still update title, description, scheduled_date, materials_deposit (clamped to the CURRENT retail_price, not the proposed one)
- After save, insert a notification: `user_id = workOrder.boats.owner_id`, title = "Approval Needed — Price Change", message including old and new price, type = "quote", related_id = work order ID

If status is `pending` or `pending_approval`, keep current behavior — update `retail_price` directly.

**Requires migration**: Add `proposed_retail_price` column to `work_orders` (from prior approved plan).

### 4. Database Migration

```sql
ALTER TABLE public.work_orders
  ADD COLUMN proposed_retail_price numeric DEFAULT NULL;
```

### Files changed
- Database migration (new) — add `proposed_retail_price` column
- `src/components/service/ServiceWorkOrders.tsx` — add "disputed" to status filter
- `src/pages/Dashboard.tsx` — exclude accepted wishes, add read-only job detail sheet
- `src/components/service/EditWorkOrderSheet.tsx` — conditional price change approval flow with notification

