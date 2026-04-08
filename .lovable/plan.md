

## Plan: Add Active Jobs Section to Owner Dashboard

### What
Add a new section between "Pending Quotes" and "Reservations" on the owner dashboard showing work orders in progress (assigned, in_progress, qc_review). Includes realtime updates.

### Changes — `src/pages/Dashboard.tsx`

**1. Add ActiveJob interface**
```typescript
interface ActiveJob {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  created_at: string;
  boat: { name: string } | null;
  business: { business_name: string } | null;
}
```

**2. Add state and fetch function**
- `const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);`
- `fetchActiveJobs` callback: query `work_orders` where `boat_id` is in the owner's boat IDs and `status` in `['assigned', 'in_progress', 'qc_review']`. Join `boats(name)` and `businesses:business_id(business_name)`. Order by `created_at desc`.
- Two-step: first get boat IDs from `boats` state, then query work orders. If no boats, skip.

**3. Call on initial load**
- Add `fetchActiveJobs` to the `Promise.all([fetchBoats(), fetchWishes()])` call — but since it depends on boat IDs, call it after boats are fetched, or fetch boat IDs independently inside the function.
- Approach: `fetchActiveJobs` will independently query the user's boat IDs from the `boats` table (same as fetchBoats does), then query work orders. This avoids dependency ordering.

**4. Realtime subscription**
- Subscribe to `postgres_changes` on `work_orders` table filtered by status changes.
- On any INSERT/UPDATE event, re-call `fetchActiveJobs`.
- Clean up subscription on unmount.

**5. Render section**
- Between `PendingQuotesSection` and `ReservationsSection` (lines 397-399).
- Only render if `activeJobs.length > 0`.
- Each card shows:
  - Title, boat name, business name
  - Status badge: assigned → blue "Scheduled", in_progress → green "In Progress", qc_review → purple "QC Review"
  - Scheduled date (if set)
  - Time since created_at (e.g. "3 days ago")
- Uses existing `Card`, `Badge` components plus `formatDistanceToNow` from date-fns.

**6. Imports to add**
- `formatDistanceToNow` from `date-fns`
- `Briefcase` or `Wrench` icon from lucide-react

### Files changed
- `src/pages/Dashboard.tsx`

