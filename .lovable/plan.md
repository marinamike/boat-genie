

## Plan: Simplify EarningsTab for Beta (No Platform Fees)

### 1. `src/components/provider/EarningsTab.tsx`

**Empty state:** Change "No Completed Jobs Yet" to "No Paid Jobs Yet" and update subtitle.

**Summary text (line 44):** Change from "After 5% lead fee deduction • N completed jobs" to "Total earnings from paid jobs • N paid jobs".

**Job list title (line 53):** Change "Completed Jobs" to "Paid Jobs".

**Per-job card:** Remove `leadFee` and `netPayout` calculations. The earnings breakdown simplifies to a single line showing gross amount as the total earned. Remove the lead fee row and net payout row entirely. Keep badge logic: `isPaid` shows green "Paid", otherwise amber "Awaiting Payment".

### 2. `src/pages/ServiceDashboard.tsx` (lines 45-54)

Filter the `completedJobs` mapping to only include work orders with status `"paid"`:
```typescript
const completedJobs = serviceManagement.completedWorkOrders
  .filter(wo => wo.status === "paid")
  .map(wo => ({ ... }));
```

### 3. `src/hooks/useServiceManagement.ts` (lines 750-754)

Update `totalEarnings` calculation to remove fee deduction — just sum `wholesale_price`:
```typescript
const totalEarnings = completedWorkOrders
  .filter(wo => wo.status === "paid")
  .reduce((sum, wo) => sum + (wo.wholesale_price || 0), 0);
```

### Files changed
- `src/components/provider/EarningsTab.tsx`
- `src/pages/ServiceDashboard.tsx`
- `src/hooks/useServiceManagement.ts`

