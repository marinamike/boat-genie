

## Plan: Return inserted record ID from pullPartForWorkOrder

### 1. `src/hooks/useStoreInventory.ts`

**Change return type** from `boolean` to `string | false` (returns the inserted record's ID on success, `false` on failure).

**Update the insert call** (line 380) to add `.select("id").single()` so the inserted record's ID is returned.

**Return the ID** instead of `true` on success (line 410).

```typescript
// Line 380: add .select().single()
const { data: logData, error: logError } = await supabase
  .from("parts_pull_log")
  .insert({
    work_order_id: workOrderId,
    inventory_item_id: itemId,
    quantity,
    unit_cost: item.unit_cost,
    total_cost: totalCost,
    charge_price: finalChargePrice,
    pulled_by: user.id,
    notes,
  })
  .select("id")
  .single();

// Line 410: return the ID
return (logData as any)?.id || true;
```

This lets the ServiceWorkOrders "Add Part" flow use the returned ID directly to update `line_item_id` on that specific `parts_pull_log` record, eliminating race conditions.

### Files changed
- `src/hooks/useStoreInventory.ts` — modify insert to return ID, change return type

