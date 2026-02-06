

## Fix: Marina Reservations Not Showing for Business Owners

### Problem Summary
When you log in as the marina owner and go to the marina dashboard, reservation requests don't appear. This is happening for two reasons:

1. **Database permissions issue**: The system is checking an old database table (`marinas`) to see if you're a marina manager, but your business is registered in the new `businesses` table.

2. **Query logic issue**: The reservations are linked to your business, but the dashboard isn't filtering reservations by your specific business.

---

### Solution

#### Step 1: Update Database Security Policy
Add a new permission rule that allows business owners to see reservations for their business.

**Database Change:**
```sql
-- Allow business owners to manage reservations for their business
CREATE POLICY "Business owners can manage their reservations"
  ON public.marina_reservations
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE owner_id = auth.uid()
    )
  );
```

#### Step 2: Update Reservation Fetching Logic
Modify the reservation hook to filter reservations by the current business.

**File: `src/hooks/useMarinaReservations.ts`**
- Add `businessId` parameter for marina role
- Filter query by `business_id` when fetching for a marina
- Update the interface to accept business context

#### Step 3: Update Dashboard Components
Wire up the BusinessContext so the marina dashboard uses the correct business ID.

**File: `src/components/marina/dashboard/PendingReservationsCard.tsx`**
- Import and use `useBusiness()` hook to get the business ID
- Pass `businessId` to the reservations hook

**File: `src/components/marina/ReservationManager.tsx`**
- Same updates to use `useBusiness()` for filtering

**File: `src/pages/MarinaDashboard.tsx`**
- Remove the old `marinas` table query
- Use `useBusiness()` to get business name and ID

---

### Technical Details

**Current Data in Database:**
- Your reservation exists: `3121a5a7-dc21-491c-b8fc-97c763553e06`
- It's linked to business: `c005a02d-6e76-4dca-9b6c-93732d9ef81c` (Marina Mike's)
- Business owner is: `625d51fb-ffce-4a1d-9efa-44a2de812140`

**Files to Modify:**
1. Database migration (new RLS policy)
2. `src/hooks/useMarinaReservations.ts` - Add business filtering
3. `src/components/marina/dashboard/PendingReservationsCard.tsx` - Use business context
4. `src/components/marina/ReservationManager.tsx` - Use business context
5. `src/pages/MarinaDashboard.tsx` - Switch from marinas to businesses table

---

### Expected Result
After these changes, when you log in as the marina owner and visit the marina dashboard, you'll see the pending reservation request from the boat owner, and you'll be able to approve or reject it.

