

## Plan: Fix Wish Form Submission — Foreign Key Mismatch

### Problem
The `wish_forms.provider_id` column has a foreign key constraint referencing the `profiles` table. However, the code passes `selectedProvider?.id` which is a `businesses.id` — not a user profile ID. This causes the FK violation: `"Key is not present in table 'profiles'"`.

### Solution
Run a database migration to change the foreign key on `wish_forms.provider_id` from referencing `profiles(id)` to referencing `businesses(id)`, since the provider selection UI picks a business, not a user profile.

### Steps

1. **Database migration**: Drop the existing `wish_forms_provider_id_fkey` constraint and add a new one referencing `businesses(id)`.

```sql
ALTER TABLE public.wish_forms
  DROP CONSTRAINT wish_forms_provider_id_fkey;

ALTER TABLE public.wish_forms
  ADD CONSTRAINT wish_forms_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES public.businesses(id);
```

2. **No code changes needed** — `useWishForm.ts` line 176 already passes `formData.providerId` correctly as a business ID.

### Technical Details
- The `ProviderSearchResults` component returns `ServiceProvider` objects whose `.id` comes from the `businesses` table
- The `WishFormSheet` passes `selectedProvider?.id` (a business ID) as `providerId`
- Only the FK target is wrong — the data flow is correct

