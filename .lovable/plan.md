

# Unify Service Categories Across Customer Wishes and Business Service Menu

## Problem

Two separate category systems exist that don't talk to each other:

| System | Categories |
|--------|-----------|
| **Wish Form** (customer) | Wash & Detail, Mechanical, Fiberglass & Gelcoat |
| **Service Menu** (business) | Mechanical, Electrical, Cosmetic, Hull, Rigging, General |

A customer requesting "Wash & Detail" can never match a business that categorizes their wash services under "Cosmetic" or "General". The categories must be unified so provider discovery works.

## Solution: Single Shared Category List

Define one canonical set of categories used everywhere:

- **Wash & Detail** -- wash, wax, interior/exterior detailing
- **Mechanical** -- engine, drive train, systems repair
- **Electrical** -- wiring, electronics, navigation equipment
- **Hull & Bottom** -- bottom painting, fiberglass, gelcoat, blister repair
- **Canvas & Upholstery** -- covers, enclosures, cushions
- **Rigging** -- standing/running rigging, sails
- **General** -- catch-all for anything else

This replaces both the old Wish `SERVICE_CATEGORIES` and the old Service Menu `SERVICE_CATEGORIES`.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useWishForm.ts` | Replace `SERVICE_CATEGORIES` with the unified list; update `ServiceCategory` type |
| `src/hooks/useServiceMenu.ts` | Replace `SERVICE_CATEGORIES` array with the same unified list |
| `src/hooks/useServiceProviders.ts` | Remove hardcoded `categoryMap` -- categories now match directly (no mapping needed) |
| `src/components/wish/WishFormSheet.tsx` | Update category rendering and icon map to handle new categories; route all categories through provider selection step (not just wash_detail) |
| `src/components/business/ServiceMenuManager.tsx` | No changes needed (already imports from `useServiceMenu`) |

## Technical Details

### Shared category constant (in useWishForm.ts, exported)

```text
SERVICE_CATEGORIES = {
  wash_detail:        { label: "Wash & Detail",        icon: Sparkles,    description: "Wash, wax, and detailing services" }
  mechanical:         { label: "Mechanical",            icon: Wrench,      description: "Engine and drive train repair" }
  electrical:         { label: "Electrical",            icon: Zap,         description: "Wiring, electronics, navigation" }
  hull_bottom:        { label: "Hull & Bottom",         icon: Paintbrush,  description: "Bottom paint, fiberglass, gelcoat" }
  canvas_upholstery:  { label: "Canvas & Upholstery",  icon: Scissors,    description: "Covers, enclosures, cushions" }
  rigging:            { label: "Rigging",               icon: Anchor,      description: "Standing and running rigging" }
  general:            { label: "General",               icon: Settings,    description: "Other marine services" }
}
```

### useServiceMenu.ts update

Replace the old array with labels derived from the shared constant:

```text
SERVICE_CATEGORIES = Object.values(WISH_SERVICE_CATEGORIES).map(c => c.label)
// Results in: ["Wash & Detail", "Mechanical", "Electrical", "Hull & Bottom", ...]
```

This ensures the dropdown in the Service Menu editor shows the exact same labels customers see.

### useServiceProviders.ts update

Remove the hardcoded `categoryMap` translation. Since business service menus now use the same label strings (e.g., "Wash & Detail"), the provider search query can match directly:

```text
// Before (broken mapping):
categoryMap = { wash_detail: "Wash & Detail", mechanical: "Mechanical", ... }

// After (direct label lookup):
const categoryLabel = SERVICE_CATEGORIES[category].label;
query.eq("category", categoryLabel);
```

### WishFormSheet.tsx update

- Update the icon map and category rendering to include the new categories
- Extend the provider selection step to all categories (not just wash_detail), so customers always pick a provider before filling the form
- Update back-navigation logic accordingly

### Data compatibility

Existing `business_service_menu` rows with old categories like "Cosmetic" or "Hull" will still display but won't match wishes until the business owner edits them to use the new labels. No migration is needed since the column is free-text. The UI will guide businesses to the correct categories going forward.
