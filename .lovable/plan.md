

# Move Rates & Billing to Slips Dashboard

## Overview
The Rates & Billing UI was incorrectly added to Business Settings (`/business/settings`). It needs to be moved to the Slips Dashboard (`/business/slips`) where it belongs operationally.

## Current Problem
- **Wrong location**: Rates tab is in Business Settings (Modules, Rates, Staff, Account)
- **Correct location**: Should be in Slips Dashboard Settings tab or as a dedicated tab

## Solution Options

Based on the Slips Dashboard structure (5 tabs: Dock Grid, Reservations, Leases, Meters, Settings), there are two options:

**Option A - Integrate into Settings Tab**: Add the rates sections (Global Slip Rates, Utility Pricing, Slip Inventory) directly into the existing SlipSettings component alongside the Utility Meters section.

**Option B - Replace Settings Tab**: Replace the current Settings tab content entirely with the RatesBillingSettings component, which already includes meter-related functionality.

**Recommended: Option A** - This maintains the existing meter management UI while adding the new rates functionality.

## Changes Required

### 1. Update SlipSettings.tsx
Add three new sections above the Utility Meters section:
- **Global Slip Rates**: Daily, Weekly, Monthly, Seasonal, Annual per-foot pricing
- **Utility Pricing**: Electric $/kWh and Water $/gallon defaults
- **Slip Inventory Manager**: Table view with edit capability

### 2. Update BusinessSettings.tsx
- Remove the "Rates" tab
- Revert to 3 tabs: Modules, Staff, Account

### 3. Pass Business Context to SlipSettings
- SlipSettings needs access to the business context for reading/writing global rates
- Update the component props or use the context directly

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/BusinessSettings.tsx` | Remove "Rates" tab, revert to 3 tabs |
| `src/components/slips/SlipSettings.tsx` | Add Global Rates, Utility Pricing, and Slip Inventory sections |
| `src/pages/SlipsDashboard.tsx` | May need to pass additional props to SlipSettings |

## UI Structure After Change

```text
Slips Dashboard (/business/slips)
├── Dock Grid
├── Reservations  
├── Leases
├── Meters
└── Settings
    ├── Global Slip Rates (Daily, Weekly, Monthly, Seasonal, Annual)
    ├── Utility Pricing (Electric $/kWh, Water $/gallon)
    ├── Slip Inventory Manager (Table with Edit)
    └── Utility Meters (existing functionality)
```

