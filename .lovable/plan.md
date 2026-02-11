

# Fix: Provider Lead Stream Not Showing Submitted Wishes

## Problem

The provider's job board (`useJobBoard.ts`) still queries the old `provider_services` table to build its list of service names for filtering incoming wishes. Since you moved all services to `business_service_menu`, the query returns zero services, which causes every wish to be filtered out (line 170: `if (serviceNames.length === 0) return false`).

## Solution

Update the service name query in `useJobBoard.ts` to read from `business_service_menu` instead of `provider_services`.

## File Changed

**`src/hooks/useJobBoard.ts`** -- lines 113-123

Replace this block:

```text
// Fetch provider's actual Service Menu items
let serviceNames: string[] = [];
if (businessProfile?.id) {
  const { data: providerServices } = await supabase
    .from("provider_services")
    .select("service_name")
    .eq("provider_id", businessProfile.id)
    .eq("is_active", true);

  serviceNames = (providerServices || []).map(s => s.service_name);
}
```

With:

```text
// Fetch provider's actual Service Menu items from business_service_menu
let serviceNames: string[] = [];
if (businessProfile?.id) {
  const { data: menuItems } = await supabase
    .from("business_service_menu")
    .select("name")
    .eq("business_id", businessProfile.id)
    .eq("is_active", true);

  serviceNames = (menuItems || []).map(s => s.name);
}
```

This is a one-to-one swap: `provider_services.service_name` becomes `business_service_menu.name`, and `provider_id` becomes `business_id`. No other files need to change since the rest of the filtering and matching logic works on the resulting string array.
