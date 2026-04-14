

## Plan: Add "Mark as Paid" button + update completed filter

### Changes

#### 1. `src/hooks/useServiceManagement.ts` (line 749)
Change the `completedWorkOrders` filter to include both statuses:
```typescript
const completedWorkOrders = workOrders.filter(wo => ["completed", "paid"].includes(wo.status));
```

#### 2. `src/components/service/ServiceWorkOrders.tsx` (after line 697, before `</CardContent>`)
Insert a "Mark as Paid" button that only renders when `selectedWorkOrder.status === "completed"`:
```typescript
{selectedWorkOrder.status === "completed" && (
  <Button
    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold"
    disabled={updatingStatus}
    onClick={() => handleStatusProgression("paid")}
  >
    {updatingStatus ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
    Mark as Paid
  </Button>
)}
```

This sits right below the status selector buttons, inside the same Card, and is hidden for all other statuses including "paid" (which already shows the green Paid badge).

### Files changed
- `src/hooks/useServiceManagement.ts` — one-line filter update
- `src/components/service/ServiceWorkOrders.tsx` — add conditional button block

