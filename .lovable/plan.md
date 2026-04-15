

## Plan: Add Debug Logging & Ensure Numeric Types in EditWorkOrderSheet

### Changes to `src/components/service/EditWorkOrderSheet.tsx`

**1. Ensure numeric values (line 68)**
Wrap `parseFloat` results in `Number()` for explicit numeric coercion:
```typescript
const basePrice = Number(parseFloat(retailPrice) || 0);
const deposit = Number(parseFloat(materialsDeposit) || 0);
```

**2. Add console.log before the update call (after line 75, before `if (priceChanged)`)**
```typescript
const updatePayload = priceChanged ? {
  title,
  description: notes || description,
  proposed_retail_price: Number(basePrice),
  materials_deposit: Math.min(clampedDeposit, originalRetailPrice),
  scheduled_date: scheduledDate || null,
  status: "pending_approval",
} : {
  title,
  description: notes || description,
  retail_price: Number(basePrice),
  wholesale_price: Number(basePrice),
  materials_deposit: clampedDeposit,
  scheduled_date: scheduledDate || null,
};

console.log("[EditWorkOrderSheet] saveChanges debug:", {
  workOrderStatus: workOrder.status,
  isActiveStatus,
  basePrice,
  basePriceType: typeof basePrice,
  originalRetailPrice,
  priceChanged,
  updatePayload,
});
```

**3. Ensure `proposed_retail_price` is explicitly `Number(basePrice)` in the update call (line 84)**
Change `proposed_retail_price: basePrice` to `proposed_retail_price: Number(basePrice)` to guarantee numeric type.

### Files changed
- `src/components/service/EditWorkOrderSheet.tsx`

