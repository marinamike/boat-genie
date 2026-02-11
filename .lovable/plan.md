

# Fix: Connect Business Service Menu to Customer Wish Flow

## Problem

You created services in the Business Settings Service Menu, which saves to the `business_service_menu` table. But when a customer makes a wish, the provider search queries the old `provider_services` table (joined with `provider_profiles`). These are two completely separate tables, so your services never show up.

## Solution

Update `useServiceProviders.ts` to query `business_service_menu` joined with `businesses` instead of `provider_services` joined with `provider_profiles`.

## Changes

### `src/hooks/useServiceProviders.ts`

**`useServiceProviders` hook** (provider discovery):
- Query `business_service_menu` instead of `provider_services`
- Join with `businesses` (using `business_id`) to get business name and logo
- Filter by `is_active = true` and matching category label
- Group results by business to show one card per business with the lowest price

**`useProviderServicesByBusiness` hook** (service dropdown after selecting a provider):
- Query `business_service_menu` instead of `provider_services`
- Filter by `business_id` (instead of `provider_id`) and active status
- Map fields: `name` becomes `service_name`, `default_price` becomes `price`, `pricing_model` maps appropriately

### `src/components/wish/WishFormSheet.tsx`

- Minor mapping update: the service dropdown field names change slightly (`name` vs `service_name`, `default_price` vs `price`)
- The `handleProviderServiceSelect` function needs to map the new field names from `business_service_menu`

## Technical Details

### New query for provider discovery

```text
supabase
  .from("business_service_menu")
  .select("id, name, pricing_model, default_price, category, business_id, business:businesses(id, business_name, logo_url, is_verified)")
  .eq("is_active", true)
  .eq("category", categoryLabel)
```

This replaces the old query against `provider_services` + `provider_profiles`.

### New query for provider service list

```text
supabase
  .from("business_service_menu")
  .select("id, name, pricing_model, default_price, description, category")
  .eq("business_id", businessId)
  .eq("is_active", true)
  .eq("category", categoryLabel)
  .order("default_price")
```

### Field mapping

| Old (provider_services) | New (business_service_menu) |
|------------------------|---------------------------|
| service_name | name |
| price | default_price |
| provider_id | business_id |
| provider_profiles | businesses |

### RLS

The `business_service_menu` table already has a SELECT policy for authenticated users who are business members. However, customers making wishes also need to read these rows. A new RLS policy will be added:

```sql
CREATE POLICY "Authenticated users can browse active service menu items"
ON public.business_service_menu FOR SELECT TO authenticated
USING (is_active = true);
```

This allows any logged-in customer to see active service offerings during the wish flow.

