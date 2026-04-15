

## Plan: Show Dispute Details on Provider Side

### Problem
When a customer disputes a line item, the work order status changes to "disputed" on the provider side, but the provider cannot see **which item** was disputed or **why**. The dispute reason and item name are stored in `invoice_line_items` (columns `disputed`, `dispute_note`, `service_name`) but the provider's work order detail panel never fetches or displays this data.

### Solution
Add a "Dispute Details" alert card in `ServiceWorkOrders.tsx` that appears when the selected work order has status `"disputed"`. It will fetch disputed line items from `invoice_line_items` via the related invoice and display the item name and dispute reason.

### Changes to `src/components/service/ServiceWorkOrders.tsx`

**1. Add state and fetch function for disputed items**
- Add state: `disputedItems` array
- Add `fetchDisputedItems(workOrderId)` that queries `invoices` by `work_order_id`, then `invoice_line_items` where `disputed = true`, returning `service_name` and `dispute_note`
- Call it in the `useEffect` when `selectedWorkOrder` changes

**2. Render dispute details card after the status selector (after line 791)**
When `selectedWorkOrder.status === "disputed"` and there are disputed items, render:
```
┌─────────────────────────────────────┐
│ ⚠️ Invoice Disputed                │
│                                     │
│ • Bottom Paint — "Price too high"   │
│ • Hull Wax — "Not requested"        │
└─────────────────────────────────────┘
```

A red-bordered Card with:
- Flag icon + "Invoice Disputed" heading
- List of each disputed item's `service_name` and `dispute_note`
- Fallback text if no dispute notes found

### Files changed
- `src/components/service/ServiceWorkOrders.tsx` — fetch and display disputed line items

