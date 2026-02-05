
# Make Discrepancy Reports Clickable with Detail View

## Overview
Add the ability to click on individual reconciliation entries in the Discrepancy Report to open a read-only detail sheet showing all recorded information from that reconciliation.

## Current State
- Discrepancy reports are displayed as a list within a Card
- Each reconciliation shows a summary: fuel type, discrepancy amounts, tank readings, and pump totalizers
- Users cannot click to see more details

## Proposed Solution
Create a new `ReconciliationDetailSheet` component that opens when a user clicks on any reconciliation entry, displaying all recorded data in a read-only format.

## Changes Required

### 1. Create New Component: `src/components/fuel/ReconciliationDetailSheet.tsx`
A read-only Sheet component that displays:
- Header with fuel type, date, and time
- Status indicator (significant discrepancy vs OK)
- Tank readings section (per-tank breakdown)
- Pump totalizer readings section
- Summary totals
- Notes (if any were recorded)
- Recorded by information

Following the existing pattern from `WorkOrderDetailSheet.tsx` for consistency.

### 2. Update `src/components/fuel/DiscrepancyReport.tsx`
- Add state to track selected reconciliation
- Make each reconciliation entry clickable with hover/cursor styles
- Add ChevronRight icon to indicate clickability
- Render the new `ReconciliationDetailSheet` component
- Pass the selected reconciliation to the sheet

## Visual Design

The clickable reconciliation cards will:
- Show a subtle hover effect
- Display a chevron icon on the right side
- Use `cursor-pointer` to indicate interactivity

The detail sheet will display:
- Full date and time header
- Fuel type with status badge
- Complete tank readings with physical vs theoretical comparison
- All pump totalizer readings with expected vs actual
- Combined discrepancy summary
- Any notes recorded during reconciliation

---

## Technical Details

### New File: `ReconciliationDetailSheet.tsx`
```typescript
interface ReconciliationDetailSheetProps {
  reconciliation: FuelReconciliation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

Key sections to display:
1. **Header**: Date/time, fuel type, status badge
2. **Tank Readings**: For each tank - theoretical vs physical gallons, individual discrepancy
3. **Pump Totalizers**: For each pump - expected vs actual meter reading, discrepancy
4. **Summary**: Combined discrepancy in gallons and percentage
5. **Notes**: Any notes recorded during reconciliation

### Update: `DiscrepancyReport.tsx`
- Import the new `ReconciliationDetailSheet`
- Add `useState` for `selectedReconciliation`
- Wrap each reconciliation div with `onClick` handler
- Add hover styles and chevron icon
- Render `ReconciliationDetailSheet` at the bottom of the component
