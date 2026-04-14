

## Plan: Invoice Review Component + Dashboard Integration (Revised)

### New File: `src/components/owner/InvoiceReview.tsx`

Component receiving `invoiceId` prop and `onClose` callback.

**Data fetching:**
- Fetch invoice joined with `businesses(id, business_name, owner_id)`, `work_orders(id, title)`, and `invoice_line_items(*)`

**UI layout:**
- Header: business name, work order title, invoice date
- Line items list: service_name, quantity, unit_price, total
- Each row: green "Verified" button and red "Dispute" button
- Verified → updates `invoice_line_items` set `verified: true`
- Dispute → shows text input for note, then updates `disputed: true, dispute_note`

**Dispute side-effects (revised):**
1. Update `invoice_line_items`: `disputed: true`, `dispute_note`
2. Update `work_orders` status to `"disputed"` via `invoice.work_order_id`
3. Look up recipient from `invoice.businesses.owner_id` (the business owner) — NOT from any provider_id field
4. Insert system message: `sender_id: auth.uid()`, `recipient_id: businesses.owner_id`, `work_order_id`, content: `"⚠️ Line item disputed: {service_name} — {note}"`

**Approve logic:**
- When all items verified → "Approve Payment" button updates `invoices` status to `"approved"`

### Changes: `src/pages/Dashboard.tsx`

1. Add `"completed"` to `fetchActiveJobs` status filter
2. Add `completed` to `statusMap`
3. For jobs with status `"completed"`, show "Review Invoice" button
4. On click, fetch `invoiceId` from `invoices` table by `work_order_id`, open Sheet with `<InvoiceReview>`
5. State: `reviewingInvoiceId: string | null`

### Files changed
- `src/components/owner/InvoiceReview.tsx` (new)
- `src/pages/Dashboard.tsx` (modified)

