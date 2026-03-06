

## Problem

The provider schedule (and entire provider dashboard) is unreachable. There are two gaps:

1. **No `provider` role in the type system** — `AppRole` only includes `boat_owner | admin | marina_staff`. No provider role exists in the enum or routing.
2. **No provider routes in `App.tsx`** — The `RoleBasedRoutes` switch statement has no `case` for a provider role, so even if someone had a provider role in the database, they'd fall through to the default (owner) routes.

The `ProviderDashboard` page, `ProviderLayout`, and `DailySchedule` component all exist and are fully built — they just can't be reached.

## Plan

### 1. Add provider role to the type system
- In `src/hooks/useUserRole.ts`, add `"provider"` to the `AppRole` union type.

### 2. Add provider routes to `App.tsx`
- Add a `case "provider":` block in the `RoleBasedRoutes` switch that mounts:
  - `ProviderLayout` as the layout wrapper
  - `/provider` → `ProviderDashboard`
  - `/profile` → `Profile`
  - `/platform-admin` → `PlatformAdmin`
  - Default redirect to `/provider`

### 3. Update database enum (if needed)
- Check if `app_role` enum in the database includes a `provider` value. If not, add it via migration so the `user_roles` table can store it.

### 4. Add provider to role selector
- Update `src/components/onboarding/RoleSelector.tsx` to include a "Service Provider" option so users can select this role during onboarding.

This will make the provider dashboard and its schedule accessible to users with the provider role.

