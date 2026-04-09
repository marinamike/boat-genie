

## Plan: Add Status Progression Buttons to Work Order Detail Panel

### Summary
Add contextual action buttons below the work order title/status in the detail panel that let staff advance a work order through its lifecycle: Start Work → Request QC → Mark Complete. "Mark Complete" gets a confirmation dialog.

### Changes — `src/components/service/ServiceWorkOrders.tsx`

**1. Add state for confirmation dialog and updating**
- `showCompleteDialog` boolean state
- `updatingStatus` boolean state for loading indicator

**2. Add `handleStatusProgression` function**
- Takes a `newStatus` string parameter
- Calls `supabase.from("work_orders").update({ status: newStatus }).eq("id", selectedWorkOrder.id)`
- On success: toast, call `fetchWorkOrders()`, update `selectedWorkOrder` with new status
- On error: toast error

**3. Render progression button after the status badge (line ~542, inside CardContent)**
Insert below the existing customer/boat info block (after line 562), before the closing `</CardContent>`:

- `assigned` → Blue "Start Work" button (Play icon) → updates to `in_progress`
- `in_progress` → Violet "Request QC Review" button (ClipboardCheck icon) → updates to `qc_review`  
- `qc_review` → Green "Mark Complete" button (CheckCircle icon) → opens `showCompleteDialog`
- Other statuses → nothing

**4. Add AlertDialog for "Mark Complete" confirmation**
- Uses existing AlertDialog imports (already imported)
- Controlled by `showCompleteDialog` state
- On confirm: calls `handleStatusProgression("completed")`
- Message: "This will mark the work order as completed. This action cannot be undone."

**5. Imports to add**
- `CheckCircle` from lucide-react (Play and ClipboardCheck already imported or available)

### Files changed
- `src/components/service/ServiceWorkOrders.tsx`

