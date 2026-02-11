
# Show Readable Service Names on Lead Cards

## Problem

Lead cards display the raw `service_type` value (e.g., `wash_detail`) instead of a human-readable label. The `service_type` field can contain either a category slug (like `wash_detail`) or an actual service name (like `Full Detail`).

## Solution

Two changes across two files:

### 1. Add a display helper for service type (`src/components/provider/LeadStream.tsx`)

Import `SERVICE_CATEGORIES` from `useWishForm` and create a helper function that:
- Checks if the `service_type` matches a category slug key (e.g., `wash_detail`)
- If yes, returns the human-readable label (e.g., "Wash & Detail")
- If no, returns the raw value as-is (it's already a readable service name like "Full Detail")

Apply this helper in three places where `wish.service_type` is displayed:
- Line 175: the `CardTitle` on each lead card
- Line 370: the `DialogDescription` in the Accept Job dialog
- Line 530 (approx): the `DialogDescription` in the Submit Quote dialog

### 2. Show marina location (`src/components/provider/LeadStream.tsx`)

Update lines 228-232 to show the actual marina name from `wish.boat_profile?.marina_name` instead of "Location revealed after acceptance". Fall back to "Location not specified" if missing.

## Technical Detail

Helper function:

```typescript
import { SERVICE_CATEGORIES } from "@/hooks/useWishForm";

function displayServiceType(serviceType: string): string {
  const category = SERVICE_CATEGORIES[serviceType as keyof typeof SERVICE_CATEGORIES];
  return category ? category.label : serviceType;
}
```

No database or hook changes needed -- this is purely a display formatting update.
