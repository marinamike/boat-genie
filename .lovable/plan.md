

## Plan: Simplify wish_forms schema and enums

### Summary
Remove `provider_id` and `work_order_id` columns from `wish_forms`, and simplify both the `wish_form_status` and `quote_status` enums to three values each.

### Migration

Create a single SQL migration that:

1. **Drop `provider_id` column** from `wish_forms` (includes dropping the foreign key constraint)
2. **Drop `work_order_id` column** from `wish_forms` (includes dropping the foreign key constraint)
3. **Replace `wish_form_status` enum** with exactly: `open`, `accepted`, `closed`
   - Map existing data: `submitted`/`reviewed` → `open`, `approved`/`converted` → `accepted`, `rejected` → `closed`
   - Recreate the enum type and update the column default to `'open'`
4. **Replace `quote_status` enum** with exactly: `pending`, `accepted`, `declined`
   - Map existing data: `rejected` → `declined`, `expired` → `declined`
   - Recreate the enum type

### Code changes (6 files)

1. **`src/hooks/useWishForm.ts`** — Remove `provider_id` from the insert payload; change `status: "submitted"` to `status: "open"`

2. **`src/hooks/useJobBoard.ts`** — Update `.in("status", ["submitted", "reviewed", "approved"])` to `.in("status", ["open"])` (only open wishes should appear on job board); remove `"reviewed"` status update call (line ~335)

3. **`src/components/wish/WishStatusCard.tsx`** — Update `statusConfig` keys to use `open`, `accepted`, `closed` for wish-level statuses; update `getEffectiveStatus` to map from new enum values; keep work order status passthrough logic

4. **`src/components/owner/WishDetailDialog.tsx`** — Update status references from old enum values to new ones

5. **`src/components/owner/PendingQuotesSection.tsx`** — Change wish_forms update from `status: "converted"` to `status: "accepted"`; remove `work_order_id` from the update payload; update rejection filter from `["submitted", "reviewed", "approved"]` to `["open"]`

6. **`src/pages/Dashboard.tsx`** — Update status filter from `"rejected"` to `"closed"`; remove `work_order_id` from the Wish interface and select query

### Technical detail: Enum replacement strategy

Postgres doesn't allow removing values from enums, so the migration will:
```sql
-- Update existing data to new values (using text cast)
ALTER TABLE wish_forms ALTER COLUMN status TYPE text;
UPDATE wish_forms SET status = 'open' WHERE status IN ('submitted','reviewed');
UPDATE wish_forms SET status = 'accepted' WHERE status IN ('approved','converted');
UPDATE wish_forms SET status = 'closed' WHERE status = 'rejected';
DROP TYPE wish_form_status;
CREATE TYPE wish_form_status AS ENUM ('open','accepted','closed');
ALTER TABLE wish_forms ALTER COLUMN status TYPE wish_form_status USING status::wish_form_status;
ALTER TABLE wish_forms ALTER COLUMN status SET DEFAULT 'open';
```

Same pattern for `quote_status`.

