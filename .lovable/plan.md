

## Plan: Add Emergency Fee Columns & `business_fees` Table

### Context

The user wants to formalize fee management on the business level beyond the service menu. Currently, "Emergency Service Fee" is detected as a menu item by name match in `LeadStream.tsx`. This migration introduces structured storage for ad-hoc business fees and a quick-toggle for emergency surcharges.

### Migration Changes

#### 1. Extend `businesses` table

```sql
ALTER TABLE public.businesses
  ADD COLUMN emergency_fee_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN emergency_fee_amount numeric NOT NULL DEFAULT 0;
```

#### 2. Create `business_fees` table

```sql
CREATE TABLE public.business_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'per_foot', 'percentage')),
  amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_fees_business_id ON public.business_fees(business_id);
```

- `pricing_model` uses a CHECK constraint (immutable enum-like guard) — values are static, so this is safe (not time-based).
- `ON DELETE CASCADE` so fees are cleaned up when a business is deleted.
- Index on `business_id` for the common scoped lookup.

#### 3. Enable RLS + Policies

```sql
ALTER TABLE public.business_fees ENABLE ROW LEVEL SECURITY;

-- SELECT: owner, staff, or platform admin
CREATE POLICY "Business members can view fees"
ON public.business_fees FOR SELECT
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

-- INSERT
CREATE POLICY "Business members can insert fees"
ON public.business_fees FOR INSERT
TO authenticated
WITH CHECK (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

-- UPDATE
CREATE POLICY "Business members can update fees"
ON public.business_fees FOR UPDATE
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
)
WITH CHECK (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);

-- DELETE
CREATE POLICY "Business members can delete fees"
ON public.business_fees FOR DELETE
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_business_staff(business_id)
  OR public.is_platform_admin()
);
```

- Uses existing security-definer helpers (`is_business_owner`, `is_business_staff`, `is_platform_admin`) — no recursion risk.
- Platform admin included for God Mode visibility, consistent with other business-scoped tables.
- Per-operation policies (split rather than `FOR ALL`) for clarity and easier future tightening.

### Notes & Open Questions

- **No data backfill** — existing emergency-fee menu items remain untouched. A future task can migrate them into `business_fees` or wire `emergency_fee_enabled`/`emergency_fee_amount` into `LeadStream.tsx`'s auto-add logic, replacing the current name-match approach. Out of scope for this migration.
- **No `updated_at`** — not requested; can be added later with a trigger using the existing `update_updated_at_column()` if needed.
- **No code changes** — this migration is schema-only. Hooks, forms, and the LeadStream auto-add logic stay as-is until follow-up work explicitly wires them up.
- **Types regen** — `src/integrations/supabase/types.ts` will refresh automatically after the migration runs.

### Files Changed

- New Supabase migration adding the two columns to `businesses`, creating `business_fees`, enabling RLS, and adding the four policies.

No application code, hook, or component changes in this step.

