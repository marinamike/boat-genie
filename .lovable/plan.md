
# Fix Misleading "Unassigned" Label in Meter Assignment Dropdown

## Problem Identified
When adding/editing a meter and selecting a slip to assign it to, the dropdown shows:
- `D20 (Unassigned)` 

The word "Unassigned" actually refers to the **dock_section** column being `null`, NOT whether the slip already has a meter assigned. This is confusing because:
1. D20 already has two meters (power and water) assigned to it
2. Users expect "Unassigned" to indicate meter assignment status, not dock section

## Root Cause
In `SlipSettings.tsx` line 335:
```tsx
{asset.asset_name} ({asset.dock_section || "Unassigned"})
```
This displays the `dock_section` value, but falls back to "Unassigned" when it's null - which is misleading.

## Solution
Change the dropdown display logic to show more useful information:
1. Show the dock section if it exists
2. If no dock section, show the asset type instead
3. Add a visual indicator showing which slips already have meters of this type assigned

## Files to Modify

| File | Change |
|------|--------|
| `src/components/slips/SlipSettings.tsx` | Update dropdown to show clearer labels and meter assignment status |

## Implementation Details

### Update Slip Selection Dropdown
Replace the confusing display logic with more useful information:

**Current (Confusing):**
```tsx
{asset.asset_name} ({asset.dock_section || "Unassigned"})
```

**Proposed (Clear):**
```tsx
{asset.asset_name}
{asset.dock_section && ` • ${asset.dock_section}`}
{hasExistingMeterOfType && " ✓ Has Meter"}
```

For example:
- `D20 ✓ Has Power Meter` - indicates a power meter is already assigned
- `D21 • Dock A` - shows the dock section
- `D22` - just the name if no dock section and no meter

### Visual Indicators
- Add a checkmark or badge next to slips that already have a meter of the selected type
- This helps users understand which slips are already configured

## Technical Approach
1. Filter the `meters` array by `meter_type` matching the current form selection
2. Map those meter `yard_asset_id` values to identify which assets have meters
3. Display a visual indicator in the dropdown for those assets
