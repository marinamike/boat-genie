

## Plan: Floating Point and Condition Fixes

### 1. `src/components/service/EditWorkOrderSheet.tsx` — Line 75
Fix floating point comparison in price change detection:
```typescript
// Change from:
const priceChanged = isActiveStatus && basePrice !== originalRetailPrice;
// To:
const priceChanged = isActiveStatus && Math.abs(basePrice - originalRetailPrice) > 0.001;
```

### 2. `src/pages/Dashboard.tsx` — Line 656
Strengthen the condition for showing the price change approval section:
```typescript
// Change from:
{selectedJobDetail.status === "pending_approval" && selectedJobDetail.proposed_retail_price != null && (
// To:
{selectedJobDetail.status === "pending_approval" && selectedJobDetail.proposed_retail_price !== null && selectedJobDetail.proposed_retail_price !== undefined && selectedJobDetail.proposed_retail_price > 0 && (
```

### 3. `src/pages/Dashboard.tsx` — Inside job detail sheet (after line 620)
Add debugging console.log inside the job detail sheet render:
```typescript
console.log("[Job Detail Sheet] status:", selectedJobDetail.status, "proposed_retail_price:", selectedJobDetail.proposed_retail_price);
```

### Files changed
- `src/components/service/EditWorkOrderSheet.tsx` — floating point comparison fix
- `src/pages/Dashboard.tsx` — condition fix + debug logging

