

# Slip & Utility Rate Management UI

## Overview
This plan implements a centralized "Rates & Billing" settings tab in the Business Dashboard where marina operators can:
1. Set global default slip rates (per-foot pricing across 5 tiers)
2. Configure utility pricing (power $/kWh, water $/gallon)
3. Manage slip inventory with inline editing (fixing the delete-only workflow)
4. Enable smart inheritance for new slips with optional premium overrides

## Current State Analysis

### Existing Infrastructure
- **Global Utility Rates**: The `businesses` table already has `power_rate_per_kwh` and `water_rate_per_gallon` columns
- **Per-Slip Rates**: The `yard_assets` table stores individual slip rates (`daily_rate_per_ft`, `weekly_rate_per_ft`, `monthly_rate_per_ft`, `seasonal_rate_per_ft`, `annual_rate_per_ft`)
- **Meter Management**: Individual meters currently store their own `rate_per_unit` - this will default from global settings
- **Settings Location**: Business settings currently live at `/business/settings` with tabs for Modules, Staff, Account

### Gaps to Fill
- No global slip rate defaults exist - need to add columns to `businesses` table
- No UI to manage global rates
- Slip editing requires opening a detail sheet with no inline edit capability
- New slips don't inherit rates from a global default

## Database Changes

### Migration: Add global slip rate columns to businesses table
```sql
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS default_daily_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_weekly_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_monthly_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_seasonal_rate_per_ft numeric,
ADD COLUMN IF NOT EXISTS default_annual_rate_per_ft numeric;
```

## Implementation Steps

### Step 1: Database Migration
Add 5 new columns to the `businesses` table for global slip rate defaults.

### Step 2: Create RatesBillingSettings Component
New component: `src/components/business/RatesBillingSettings.tsx`

**Section 1: Global Slip Rates**
- Form with 5 input fields (Daily, Weekly, Monthly, Seasonal, Annual rates per foot)
- Save button updates `businesses` table
- Displays current values with sensible defaults

**Section 2: Utility Pricing**
- Two input fields: Electric ($/kWh) and Water ($/gallon)
- Updates `businesses.power_rate_per_kwh` and `businesses.water_rate_per_gallon`
- Note: These become the default for new meters and the multiplier during checkout

**Section 3: Slip Inventory Manager**
- Table view with columns: Slip Name, Type, Max Length, Status, Rate Profile
- Status shows: Available/Occupied badge
- Rate Profile shows: "Custom" badge if rates differ from global, or "Standard" if using defaults
- Edit button (pencil icon) opens inline edit sheet for name, dimensions, and rates
- Rate Override toggle: When enabled, shows individual rate fields; when disabled, uses global defaults

### Step 3: Update BusinessSettings Page
Add a 4th tab "Rates & Billing" with a DollarSign icon to the existing tabs.

### Step 4: Update useYardAssets Hook
Extend `createAsset` to accept optional `useGlobalRates` parameter:
- If true (default), fetch global rates from business and apply to new asset
- If false, use provided custom rates

### Step 5: Update AssetForm Component
Add "Use Standard Rates" toggle:
- When ON: Hide rate inputs, display message "Will use global rates"
- When OFF: Show rate inputs for custom/premium pricing

### Step 6: Update SlipDetailSheet
Add an "Edit" button that opens the same edit sheet used in the inventory manager.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/business/RatesBillingSettings.tsx` | Main rates & billing settings component with 3 sections |
| `src/components/slips/SlipEditSheet.tsx` | Reusable slip editing sheet for inline edits |

## Files to Modify

| File | Change |
|------|---------|
| `src/pages/BusinessSettings.tsx` | Add 4th tab for "Rates & Billing" |
| `src/hooks/useYardAssets.ts` | Add global rate inheritance logic to createAsset |
| `src/components/slips/AssetForm.tsx` | Add "Use Standard Rates" toggle |
| `src/components/slips/SlipDetailSheet.tsx` | Add "Edit" button linking to SlipEditSheet |
| `src/components/slips/SlipSettings.tsx` | Remove rate_per_unit input from meter form (use global default) |

## UI Mockup

```text
+--------------------------------------------------+
| Business Settings                                 |
| Marina Mike's                                    |
+--------------------------------------------------+
| [Modules] [Staff] [Rates & Billing] [Account]   |
+--------------------------------------------------+

RATES & BILLING TAB:

+--------------------------------------------------+
| Global Slip Rates (Default Pricing)              |
| These rates apply to new slips automatically     |
+--------------------------------------------------+
| Daily     | Weekly    | Monthly   | Seasonal | Annual |
| $[2.50]   | $[15.00]  | $[45.00]  | $[200]   | $[350] |
|                                    [Save Rates]  |
+--------------------------------------------------+

+--------------------------------------------------+
| Utility Pricing                                  |
| Default rates for power and water billing        |
+--------------------------------------------------+
| Electric: $[0.15] / kWh   Water: $[0.01] / gal  |
|                                    [Save Rates]  |
+--------------------------------------------------+

+--------------------------------------------------+
| Slip Inventory (4 slips)                         |
+--------------------------------------------------+
| Name  | Type     | Max LOA | Status    | Rates   | Action |
|-------|----------|---------|-----------|---------|--------|
| D20   | Wet Slip | 60 ft   | Available | Standard| [Edit] |
| D21   | Wet Slip | 50 ft   | Occupied  | Custom  | [Edit] |
| D22   | Dry Rack | 30 ft   | Available | Standard| [Edit] |
| T-1   | T-Head   | 80 ft   | Available | Premium | [Edit] |
+--------------------------------------------------+
```

## Smart Inheritance Logic

When creating a new slip:
1. Fetch business global rates
2. If global rates exist, pre-populate slip rate fields
3. Show toggle: "Use Standard Rates" (default ON)
4. If toggled OFF, allow custom rate entry
5. Save either null (inherit) or explicit values (custom)

During billing calculation:
1. Check if slip has explicit rates
2. If null, fall back to business global rates
3. Apply tiered calculation as before

## Technical Details

### Rate Inheritance Check
```typescript
const getEffectiveRate = (asset: YardAsset, business: Business, tier: string) => {
  const assetRate = asset[`${tier}_rate_per_ft`];
  if (assetRate !== null && assetRate !== undefined) {
    return assetRate; // Custom rate
  }
  return business[`default_${tier}_rate_per_ft`] || 0; // Global default
};
```

### Utility Rate Default
When creating a new meter, pre-populate `rate_per_unit` from:
- `business.power_rate_per_kwh` for power meters
- `business.water_rate_per_gallon` for water meters

## Edge Cases Handled

1. **No global rates set**: Show placeholder values and warning message
2. **Existing slips with rates**: Keep existing rates, don't overwrite
3. **Occupied slips**: Disable certain fields during edit (e.g., type change)
4. **Rate conflicts**: If slip has custom rates that match global, show as "Standard"

