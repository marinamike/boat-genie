

## Plan: Rewrite WishFormSheet with catalog-driven 4-step flow

### Summary
Replace the current WishFormSheet with a clean 4-step wizard: select-boat → select-category → select-service → form. Remove all pricing/rate logic. Use the `service_catalog` table for service names. Submit saves `service_category` and `service_name` to `wish_forms`.

### Step-by-step changes to `src/components/wish/WishFormSheet.tsx`

**1. Imports cleanup**
- Remove: `useWishForm`, `SERVICE_CATEGORIES`, `ServiceCategory`, `ServiceRate`, `formatPrice`, `Upload`, `X`, `Info`
- Add: `supabase` from client, `Loader2` from lucide
- Keep: `Sheet`, `Button`, `Textarea`, `Label`, `Checkbox`, `Switch`, `Badge`, `Card`, `Input`, `ChevronLeft`, `AlertTriangle`, `Sparkles`, `MapPin`, and the marina reservation sheet

**2. Replace category data**
- Define inline `WISH_CATEGORIES` array with 9 entries, each having `key`, `label`, `description`, `icon`. Icons mapped: Sparkles (Detailing), Wrench (Engines), Zap (Electrical), Paintbrush (Hull), Droplets (Plumbing), Scissors (Canvas), Anchor (Rigging), Compass (Stabilizers), Settings (Custom Request)
- Keep "Find a Marina" as a separate card below the categories (unchanged)

**3. Update Step type and state**
- `Step = "select-boat" | "select-category" | "select-service" | "form"`
- New state: `selectedCategory: string | null`, `selectedService: string`, `catalogServices: string[]`, `loadingCatalog: boolean`
- Remove: `serviceRates`, `photos`, `photoUrls`, all pricing state, `membershipTier` usage for pricing

**4. Step 2 — select-category**
- Render 9 category cards from `WISH_CATEGORIES`
- On click: set `selectedCategory`, if "Custom Request" → set `selectedService` to "Custom Request" and skip to "form", otherwise fetch catalog services and go to "select-service"

**5. Step 3 — select-service (new)**
- Fetch from `service_catalog` where `category = selectedCategory`
- Show list of clickable cards with service names
- On click: set `selectedService`, advance to "form"
- Back button returns to select-category

**6. Step 4 — form (simplified)**
- Summary header: boat name, category, service name as badges
- Fields: Description/Notes (required textarea), Preferred Date (optional), Earliest availability checkbox, Emergency toggle (no fee display — just label "Priority service")
- Remove: photo upload, price display, service rate selection, broker model info, hull photo requirement

**7. Submit handler**
- Direct insert to `wish_forms` with: `requester_id`, `boat_id`, `service_category`, `service_name`, `service_type` (set to `service_name` for backward compat), `description`, `urgency`, `is_emergency`, `preferred_date`, `status: "open"`
- Remove `uploadPhotos`, `calculatePrice`, `submitWish` from useWishForm — do inline supabase insert
- Show success toast, close sheet, call `onSuccess`

**8. Props cleanup**
- Remove `membershipTier` from props interface (no longer needed for pricing)

