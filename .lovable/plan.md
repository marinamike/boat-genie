

## Plan: Add `service_category` and `service_name` columns to `wish_forms`

### Database Migration

Add two nullable text columns to `wish_forms`:

```sql
ALTER TABLE public.wish_forms
  ADD COLUMN service_category TEXT,
  ADD COLUMN service_name TEXT;
```

No RLS changes needed — existing policies cover all columns. The existing `service_type` column remains untouched.

