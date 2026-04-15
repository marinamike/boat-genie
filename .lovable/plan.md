

## Plan: Fix Duplicate Invoice Creation on Re-completion

### Root Cause

When a customer disputes a line item, the work order status changes to "disputed". When the provider resolves the dispute and sets the status back to "completed", the code at line 226 of `ServiceWorkOrders.tsx` unconditionally creates a **new** invoice — it never checks if one already exists.

This creates duplicate invoice rows for the same work order. When the customer then tries to open the invoice, `Dashboard.tsx` uses `.maybeSingle()` which errors when multiple rows are returned, causing the "Failed to load invoice" error.

Database confirms duplicates exist (e.g., work order `9cf746c8...` has 2 invoices).

### Fix

**1. `src/components/service/ServiceWorkOrders.tsx` (line ~226)** — Before creating a new invoice, check if one already exists for this work order. If it does:
- Update the existing invoice's status back to `"pending_review"` and recalculate the total
- Delete the old `invoice_line_items` and re-insert fresh ones from the current work order line items
- Skip creating a new invoice row

```typescript
if (newStatus === "completed") {
  try {
    // Check for existing invoice
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("work_order_id", selectedWorkOrder.id)
      .limit(1)
      .maybeSingle();

    // ... fetch line items and parts as before ...

    if (existingInvoice) {
      // Update existing invoice
      await supabase.from("invoices")
        .update({ status: "pending_review", total_amount: totalAmount })
        .eq("id", existingInvoice.id);
      // Delete old line items
      await supabase.from("invoice_line_items")
        .delete()
        .eq("invoice_id", existingInvoice.id);
      // Re-insert fresh line items
      // ... insert logic using existingInvoice.id ...
    } else {
      // Create new invoice (existing logic)
    }
  }
}
```

**2. Database cleanup** — Migration to remove duplicate invoices, keeping only the most recent one per work order.

### Files changed
- `src/components/service/ServiceWorkOrders.tsx` — check for existing invoice before creating a new one
- Database migration — deduplicate existing invoice records

