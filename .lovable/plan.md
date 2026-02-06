
## Check-Out Flow with Billing Duration

### What You're Asking For
After a boat is checked in, there needs to be a clear way to check it out. The check-in to check-out timestamps are critical for calculating final billing.

### Current State
- **LiveDockList.tsx**: Has a small LogOut icon button for each vessel, but no confirmation dialog
- **ReservationManager.tsx**: Shows "Currently Checked In" reservations but has no checkout button
- **useLiveDockStatus.ts**: The `checkOutBoat` function exists and records `checked_out_at` timestamp

The checkout happens too quickly (one click) with no confirmation, no duration display, and no billing summary.

### Solution

#### Changes to ReservationManager.tsx
Add a "Check Out" button for reservations with `checked_in` status, with a confirmation dialog that shows:
- Vessel name and slip assignment
- Check-in timestamp
- Current duration (calculated from check-in to now)
- Per-foot rate for the stay type
- Estimated total based on duration

#### Changes to LiveDockList.tsx
Replace the simple LogOut icon button with a proper "Check Out" button that opens a confirmation dialog showing:
- Vessel details
- Stay duration since check-in
- Confirmation before checking out

### Technical Implementation

**File 1: `src/components/marina/ReservationManager.tsx`**

1. Add "check-out" to the `actionType` union:
```typescript
const [actionType, setActionType] = useState<"approve" | "reject" | "check-in" | "check-out" | null>(null);
```

2. Import `checkOutBoat` from `useLiveDockStatus`:
```typescript
const { checkInBoat, checkOutBoat } = useLiveDockStatus();
```

3. Add state for the dock status ID (needed for checkout):
```typescript
const [dockStatusId, setDockStatusId] = useState<string | null>(null);
```

4. Add "Check Out" button for `checked_in` reservations in `renderReservationCard`:
```typescript
{reservation.status === "checked_in" && (
  <Button size="sm" variant="outline" onClick={() => openAction(reservation, "check-out")}>
    <LogOut className="w-4 h-4 mr-1" />
    Check Out
  </Button>
)}
```

5. Fetch dock_status record when opening checkout dialog:
```typescript
// Query dock_status to find the active record for this reservation
const { data: dockRecord } = await supabase
  .from("dock_status")
  .select("id, checked_in_at")
  .eq("reservation_id", reservation.id)
  .eq("is_active", true)
  .single();
```

6. Add Check-Out Dialog showing:
   - Vessel name and slip
   - Check-in timestamp
   - Duration (formatted as days, hours, minutes)
   - Confirm Check-Out button

7. Add `handleCheckOut` function:
```typescript
const handleCheckOut = async () => {
  if (!dockStatusId) return;
  setProcessing(true);
  await checkOutBoat(dockStatusId);
  setProcessing(false);
  closeDialog();
};
```

**File 2: `src/components/marina/LiveDockList.tsx`**

1. Add Dialog components for checkout confirmation:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
```

2. Add state for selected dock status and dialog visibility:
```typescript
const [checkoutTarget, setCheckoutTarget] = useState<DockStatusWithDetails | null>(null);
```

3. Replace the icon-only LogOut button with a labeled button:
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => setCheckoutTarget(status)}
>
  <LogOut className="w-4 h-4 mr-1" />
  Check Out
</Button>
```

4. Add confirmation dialog showing:
   - Vessel name
   - Slip number
   - Check-in time
   - Duration (e.g., "2 days, 5 hours")
   - Confirm button

5. Calculate duration helper:
```typescript
const calculateDuration = (checkedInAt: string) => {
  const start = new Date(checkedInAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
};
```

### Duration & Billing Display

The check-out dialog will show:
```
+----------------------------------------+
|  Check Out Vessel                      |
+----------------------------------------+
|  Vessel: Sea Breeze                    |
|  Slip: D20                             |
|                                        |
|  Checked In: Feb 6, 2026 at 10:30 AM   |
|  Duration: 2 days, 5 hours             |
|                                        |
|  Stay Type: Transient                  |
|  Rate: $2.50/ft per day                |
|  Vessel Length: 35ft                   |
|  Estimated: ~$175.00                   |
|                                        |
|  [Cancel]              [Confirm Checkout]|
+----------------------------------------+
```

### Files to Modify
1. `src/components/marina/ReservationManager.tsx` - Add checkout action and dialog
2. `src/components/marina/LiveDockList.tsx` - Improve checkout button with confirmation dialog
