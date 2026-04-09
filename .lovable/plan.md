

## Plan: Replace Status Buttons with Selector + Add "Paid" Status

### Database Migration
Add `paid` to the `work_order_status` enum:
```sql
ALTER TYPE public.work_order_status ADD VALUE 'paid';
```

### Changes — `src/components/service/ServiceWorkOrders.tsx`

**1. Add "paid" to statusConfig**
Add entry: `paid: { label: "Paid", className: "bg-green-100 text-green-800 border-green-300" }`.

**2. Replace progression buttons (lines 589-619) with a status selector**
Remove the three conditional `Button` blocks (Start Work, Request QC Review, Mark Complete). Replace with:
- If status is `"paid"`: show only a green "Paid" badge, no selector, hide Edit button.
- Otherwise: render a segmented control (row of 4 buttons: Assigned, In Progress, QC Review, Completed). The active status is highlighted with its color; others are outlined/muted. Clicking any button calls `handleStatusProgression(newStatus)` immediately. Disable while `updatingStatus` is true.

**3. Update `handleStatusProgression`**
Add `"paid"` to the labels map and update the toast for generic status changes. Remove `setShowCompleteDialog(false)` since the completion confirmation dialog is being removed.

**4. Remove the "Mark Complete" AlertDialog (lines 976-993)**
No longer needed — status changes are direct. Also remove `showCompleteDialog` state.

**5. Auto-advance on Check In (handlePunchIn, line ~445)**
After `await punchIn(...)`, add:
```typescript
if (selectedWorkOrder.status === "assigned") {
  await handleStatusProgression("in_progress");
}
```

**6. Update fetchWorkOrders status filter (line 176)**
Add `"paid"` to the `.in("status", [...])` array.

**7. Lock paid work orders**
When `selectedWorkOrder.status === "paid"`, hide the Edit button and the status selector. Only the Paid badge is shown.

### Technical Details
- The segmented control is built from plain `Button` components in a flex row — no new dependencies needed.
- Status options array: `[{value: "assigned", label: "Assigned", color: "blue"}, {value: "in_progress", label: "In Progress", color: "emerald"}, {value: "qc_review", label: "QC Review", color: "violet"}, {value: "completed", label: "Completed", color: "gray"}]`.
- `"paid"` is never in the selector — it can only be set externally (e.g., billing system).

### Files changed
- `src/components/service/ServiceWorkOrders.tsx`
- Database migration: add `paid` to `work_order_status` enum

