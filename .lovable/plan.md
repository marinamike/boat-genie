
# System Architecture Refactor & Data Reset Plan

## Overview
This plan addresses three major objectives:
1. **Data Purge** - Clear all operational data while preserving the `info@marinamike.com` admin account
2. **Logic Rewire** - Unify request flows to target `business_id` and remove legacy references to separate `marina_profiles` or `provider_profiles` tables
3. **Admin Gate Check** - Ensure the platform admin (`info@marinamike.com`) can access the system without being forced through "Create Business" flows

---

## Phase 1: Data Purge (Database Migration)

### Tables to Purge (in order due to foreign key dependencies)

**Child tables first:**
- `time_entries` (0 rows currently)
- `work_order_phases` (depends on work_orders)
- `parts_pulls` (depends on work_orders)
- `dock_work_orders` (depends on work_orders)
- `messages` (chat messages)
- `quotes` (6 rows)
- `work_orders` (6 rows)
- `marina_reservations` (5 rows)
- `lease_agreements` (depends on businesses)
- `fuel_transactions` (3 rows)
- `fuel_deliveries` (3 rows)
- `fuel_reconciliations`
- `fuel_prices`
- `fuel_price_history`
- `fuel_pumps`
- `fuel_tanks` (3 rows)
- `store_inventory` (3 rows)
- `sales_receipt_items`
- `sales_receipts`
- `meter_readings`
- `utility_meters`
- `yard_calendar`
- `yard_equipment`
- `haul_out_bays`
- `boats_on_blocks`
- `yard_assets`
- `qc_inspections`
- `qc_checklist_templates`
- `service_staff`
- `service_invoices`
- `staff_invites`
- `business_staff` (0 rows)
- `provider_services`
- `provider_checkins`
- `provider_approval_logs`
- `provider_profiles` (1 row - legacy table)
- `dock_status`
- `marina_slips`
- `marina_qr_codes`
- `marina_settings`
- `marina_staff_requests`
- `marina_leads`
- `marinas` (1 row - legacy table)
- `businesses` (1 row)

**Tables to PRESERVE:**
- `profiles` - Keep all user profiles (including admin)
- `user_roles` - Keep role assignments
- `boats` - Keep vessel data (owned by users)
- `boat_*` tables - Keep vessel-related data
- `vessel_*` tables - Keep vessel specs/documents
- `wish_forms` - Keep service requests
- `notifications` - Keep notification history
- `master_equipment_specs` - Reference data
- `vessel_specs` - Reference data
- `warranty_defaults` - Reference data
- `welcome_packet_files` - Reference data

---

## Phase 2: Logic Rewire - Unified Request Flow

### Current State Analysis
The codebase has **dual legacy references**:
1. `marina_id` - References the old `marinas` table (19+ files)
2. `provider_id` - References the old `provider_profiles` table (23+ files)

### Target Architecture
All requests should target `business_id` in the unified `businesses` table.

### Files Requiring Updates

**Hooks (High Priority):**
```
src/hooks/useProviderProfile.ts    - Uses provider_profiles table
src/hooks/useProviderServices.ts   - Uses provider_id
src/hooks/useJobBoard.ts           - Uses provider_profiles for rates
src/hooks/useProviderWorkOrder.ts  - Uses provider_profiles
src/hooks/useWorkOrderChat.ts      - Uses provider_profiles
src/hooks/useAdminDashboard.ts     - Uses provider_profiles
src/hooks/useMarinaReservations.ts - Uses marinas table
src/hooks/useUserRole.ts           - Uses marinas table
```

**Components (Medium Priority):**
```
src/components/admin/ComplianceQueue.tsx     - Uses provider_profiles
src/components/owner/PendingQuotesSection.tsx - Uses provider_profiles
src/components/admin/WatchtowerMap.tsx       - Uses marinas table
src/components/admin/MarinaLeadTracker.tsx   - Uses marinas table
src/components/marina/MarinaAdminPanel.tsx   - Uses marinas table
```

**Pages (Medium Priority):**
```
src/pages/MarinaDashboard.tsx - Uses marinas table
```

### Migration Strategy
1. Update queries to use `businesses` table with appropriate `enabled_modules` checks
2. Replace `marina_id` references with `business_id` where applicable
3. Replace `provider_id` references with `business_id` where applicable
4. Legacy `provider_profiles` fields (e.g., `hourly_rate`, `service_categories`) already exist in `businesses` table

---

## Phase 3: Modular Visibility

### Current Implementation (Already Correct)
The `BusinessLayout.tsx` already filters navigation tabs based on `enabledModules`:

```typescript
const visibleModuleItems = moduleNavItems.filter((item) => {
  if (!item.module) return true;
  return enabledModules.includes(item.module) && hasModuleAccess(item.module, "read");
});
```

### Verification Needed
- Ensure `BusinessDashboard.tsx` shows appropriate empty state when no modules enabled
- Ensure module cards only render for enabled modules (already implemented)

---

## Phase 4: Admin Gate Exemption

### Problem
When the platform admin (`info@marinamike.com`) logs in with role `admin`, they are routed to `/business` which requires a `business` record. If no business exists, they see "Set Up Business" instead of the Platform Admin dashboard.

### Solution
Modify `BusinessDashboard.tsx` to detect the platform admin and show an alternative UI:

```typescript
const PLATFORM_ADMIN_EMAIL = "info@marinamike.com";

// In the component:
const { user } = useAuth();
const isPlatformAdmin = user?.email === PLATFORM_ADMIN_EMAIL;

// If platform admin and no business, show admin quick-access panel instead of "Set Up Business"
if (!business && isPlatformAdmin) {
  return (
    <AdminQuickAccessPanel />  // Links to /platform-admin
  );
}
```

### Additional Route Protection
Update `App.tsx` to ensure `/platform-admin` is accessible from any role for the admin email:
- Already implemented: Route exists for all role branches
- Verification: PlatformAdmin.tsx has its own email check

---

## Technical Implementation Summary

### Database Migration (SQL)
```sql
-- Phase 1: Truncate operational tables (preserving profiles and reference data)
-- Order matters due to foreign key constraints

TRUNCATE TABLE time_entries CASCADE;
TRUNCATE TABLE work_order_phases CASCADE;
TRUNCATE TABLE parts_pulls CASCADE;
TRUNCATE TABLE dock_work_orders CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE work_orders CASCADE;
-- ... (full list as detailed above)
TRUNCATE TABLE businesses CASCADE;
```

### Code Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/BusinessDashboard.tsx` | Modify | Add platform admin exemption UI |
| `src/hooks/useProviderProfile.ts` | Refactor | Use `businesses` table instead of `provider_profiles` |
| `src/hooks/useProviderServices.ts` | Refactor | Replace `provider_id` with `business_id` |
| `src/hooks/useJobBoard.ts` | Refactor | Get rates from `businesses` table |
| `src/hooks/useMarinaReservations.ts` | Refactor | Replace `marina_id` with `business_id` |
| `src/hooks/useUserRole.ts` | Refactor | Remove `marinas` table dependency |
| `src/components/admin/ComplianceQueue.tsx` | Refactor | Use `businesses` for verification queue |
| `src/components/owner/PendingQuotesSection.tsx` | Refactor | Get provider info from `businesses` |
| `src/components/admin/WatchtowerMap.tsx` | Refactor | Use `businesses` for map markers |

---

## Outcome Verification Checklist

After implementation:
- [ ] All operational data tables are empty
- [ ] `profiles` table still contains admin account
- [ ] `info@marinamike.com` can log in and access `/platform-admin` immediately
- [ ] Business Dashboard shows admin panel instead of "Set Up Business" for platform admin
- [ ] New service/slip requests target `business_id` in `businesses` table
- [ ] Bottom nav tabs only show for enabled modules
- [ ] No console errors referencing `marinas` or `provider_profiles` tables for core flows
