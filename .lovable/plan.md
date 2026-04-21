

## Plan: Add Length Range Columns to Service Menu

### Database Migration

Add two nullable numeric columns to `business_service_menu`:

- `min_length` (numeric, nullable) — minimum boat length in feet for this pricing tier
- `max_length` (numeric, nullable) — maximum boat length in feet for this pricing tier

Semantics:
- `NULL min_length` → no lower bound
- `NULL max_length` → no upper bound
- Both fields are optional regardless of `pricing_model` (fixed, hourly, per_foot, diagnostic_fee)

```sql
ALTER TABLE public.business_service_menu
  ADD COLUMN min_length numeric NULL,
  ADD COLUMN max_length numeric NULL;
```

No backfill needed (existing rows default to NULL = unbounded). No RLS changes needed (existing policies cover the table).

### Files Changed

- New migration: `supabase/migrations/<timestamp>_add_length_range_to_service_menu.sql`

### Notes

This migration only adds the schema. UI surfacing of the new fields in `ServiceMenuManager.tsx` and any pricing/matching logic that should consume length ranges will need follow-up work — let me know if you want those wired up next.

