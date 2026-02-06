

## Add Reservation Requests Tab to Slips Dashboard

### Problem
You're logged in as the marina/business owner and you don't see the reservation request that was submitted. You want to view and manage reservation requests within the Slips module at `/business/slips`.

Currently, the SlipsDashboard only has four tabs:
1. Dock Grid - visual slip/space management
2. Leases - long-term lease agreements
3. Meters - utility meter readings
4. Settings - slip configuration

There is no tab showing incoming reservation requests, even though the data exists in the database and the RLS policies are now correct.

### Solution
Add a new "Reservations" tab to the SlipsDashboard that displays the ReservationManager component. This will allow business owners to see pending, approved, and checked-in reservations directly within the Slips module.

---

### Changes

**File: `src/pages/SlipsDashboard.tsx`**

Add a fifth tab called "Reservations" that shows the existing ReservationManager component:

1. Import the ReservationManager component
2. Add a new tab trigger with a Calendar icon labeled "Reservations"
3. Add the ReservationManager as tab content
4. Include a badge showing pending count for visibility

```text
Tabs Structure (After):
+----------+--------+--------+----------+---------------+
| Dock Grid| Leases | Meters | Settings | Reservations  |
+----------+--------+--------+----------+---------------+
                                         (pending badge)
```

---

### Technical Details

**Import to add:**
```typescript
import { ReservationManager } from "@/components/marina/ReservationManager";
import { Calendar } from "lucide-react";
```

**Tab trigger to add:**
```tsx
<TabsTrigger value="reservations" className="flex items-center gap-2">
  <Calendar className="w-4 h-4" />
  <span className="hidden sm:inline">Reservations</span>
</TabsTrigger>
```

**Tab content to add:**
```tsx
<TabsContent value="reservations" className="mt-4">
  <ReservationManager />
</TabsContent>
```

The ReservationManager component already:
- Uses the `useBusiness()` hook to get the current business ID
- Fetches reservations filtered by `business_id`
- Provides approve/reject/check-in functionality
- Shows pending, approved, and checked-in reservations

---

### Expected Result
After this change, when you navigate to `/business/slips`, you'll see a fifth tab called "Reservations". Clicking it will show your pending reservation request from the boat owner, and you'll be able to approve or reject it directly from this view.

