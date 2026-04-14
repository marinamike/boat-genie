

## Plan: Auto-generate invoice on "completed" status

### Summary
When `handleStatusProgression` is called with `"completed"`, after the work order status update succeeds, automatically create an invoice and its line items from the existing `work_order_line_items`.

### Verified prerequisite
The `boats` join already includes `owner_id` in the select query (line 175: `boats(name, make, model, owner_id)`). No changes needed there.

### Changes — `src/components/service/ServiceWorkOrders.tsx`

**Modify `handleStatusProgression`**

After the successful status update, add a check: if `newStatus === "completed"`:

1. Fetch `work_order_line_items` for `selectedWorkOrder.id`
2. Calculate `totalAmount` as the sum of all line item `total` values
3. Get `owner_id` from `selectedWorkOrder.boats?.owner_id` (null for guest customers)
4. Insert one row into `invoices` with `work_order_id`, `business_id`, `boat_id`, `owner_id`, `guest_customer_id`, `status: "pending_review"`, `total_amount`
5. If line items exist, bulk-insert into `invoice_line_items` mapping each to: `invoice_id`, `service_name`, `quantity`, `unit_price`, `total`, `verified: false`
6. Toast: "Invoice generated and sent to customer for review."
7. Errors are logged and toasted but don't block the already-successful status change

### Files changed
- `src/components/service/ServiceWorkOrders.tsx` — modify `handleStatusProgression` only

