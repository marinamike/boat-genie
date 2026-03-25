

## Plan: Replace locked provider_services with business_service_menu in CreateWorkOrderDialog

### Problem
Step 2 of `CreateWorkOrderDialog` fetches services from the legacy `provider_services` table filtered by `is_locked: true`. It should instead use the `business_service_menu` table (active items), which is the canonical service catalog.

### Changes

**1. Update `useProviderWorkOrder.ts` — replace `fetchProviderServices`**
- Change the query from `provider_services` (filtered by `is_locked`) to `business_service_menu` (filtered by `is_active`)
- Map `business_service_menu` fields (`name`, `pricing_model`, `default_price`, `description`, `category`) to the existing `ProviderServiceOption` interface
- Update `pricingModel` type to include `"hourly"` (since business_service_menu supports fixed/hourly/per_foot)
- The `ProviderServiceOption` interface gets a minor update: `pricingModel` becomes `"per_foot" | "flat_rate" | "hourly"` (mapping `"fixed"` → `"flat_rate"` for compatibility)

**2. Update `CreateWorkOrderDialog.tsx` — Step 2 UI**
- Remove the "No Locked Services" empty state (lines 426-436) referencing locking prices
- Replace with a simple "No services configured" message pointing to Service Menu in settings
- Add handling for `hourly` pricing model in the badge display (e.g., `$X/hr`)
- The service selection cards remain the same — click to select, grouped by category

**3. Update pricing display in Step 3**
- Handle `hourly` pricing model in the quote step (similar to per_foot: show note if no hours specified, or default to base rate)

### Technical Detail
- `business_service_menu.pricing_model` values: `"fixed"`, `"hourly"`, `"per_foot"`
- `ProviderServiceOption.pricingModel` values: `"flat_rate"`, `"per_foot"` (+ adding `"hourly"`)
- Mapping: `fixed` → `flat_rate` in the hook to minimize downstream changes
- `calculateQuote` already handles `flat_rate` and `per_foot`; will add `hourly` case (treats like flat_rate for base price since hours are determined at completion)

