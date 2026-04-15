

## Plan: Fix `proposed_retail_price` Not Being Saved

### Root Cause

There are **two code paths** that set work orders to `pending_approval` status:

1. **`EditWorkOrderSheet.tsx`** (line 77-83) — Correctly sets `proposed_retail_price` while preserving the original `retail_price`. This path works correctly in code, but the records in the DB still show NULL, which suggests this path may not be the one actually triggered during testing.

2. **`ServiceWorkOrders.tsx`** (lines 455-462) — When adding a line item to an active work order, this path sets `retail_price` directly to the new total and sets status to `pending_approval`, but **never sets `proposed_retail_price`**. This is the bug — the proposed price is lost because `retail_price` is overwritten immediately.

### Fix

**`src/components/service/ServiceWorkOrders.tsx` (lines 455-462)** — Change the update to store the new price as `proposed_retail_price` and keep the original `retail_price` unchanged:

```typescript
// Before (broken):
await supabase.from("work_orders").update({
  retail_price: newTotal,
  wholesale_price: newTotal,
  status: "pending_approval",
  approved_at: null,
})

// After (fixed):
// Only use proposed_retail_price when re-approval is needed
if (needsReapproval) {
  await supabase.from("work_orders").update({
    proposed_retail_price: newTotal,
    status: "pending_approval",
    approved_at: null,
  }).eq("id", selectedWorkOrder.id);
} else {
  await supabase.from("work_orders").update({
    retail_price: newTotal,
    wholesale_price: newTotal,
    status: "pending_approval",
    approved_at: null,
  }).eq("id", selectedWorkOrder.id);
}
```

When `needsReapproval` is true (job already approved/assigned), store the new total as `proposed_retail_price` so the owner can compare original vs proposed. When the job is still in pending/pending_approval status, update `retail_price` directly since no prior approval exists.

### Files changed
- `src/components/service/ServiceWorkOrders.tsx` — use `proposed_retail_price` for re-approval flow

