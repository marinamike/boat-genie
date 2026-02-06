

# Add Electricity Type to Reservation Requests

## Overview
Marina operators need to know the vessel's shore power requirements when reviewing reservation requests to properly assign slips. The power field exists in the database but is underutilized in the current UI.

## Current State
- The `power_requirements` field exists in `marina_reservations` table
- Power selection only appears if the marina has configured `power_options` 
- Power requirements are not visible in the ReservationManager when reviewing/approving requests
- Boat specs can store `shore_power` but this isn't prominently featured

## Solution

### 1. Always Show Power Selection in Reservation Form
Update the ReservationRequestSheet to always display a power requirements selector with standard shore power options, regardless of marina configuration:

**Standard Options:**
- No shore power needed
- 30 Amp (120V)
- 50 Amp (125V)  
- 50 Amp (250V)
- 100 Amp (single phase)
- 100 Amp (3-phase)

Pre-populate with the boat's stored `shore_power` spec if available.

### 2. Display Power Requirements in Reservation Cards
Add a prominent power badge to the reservation card in ReservationManager so marina staff can immediately see power needs when reviewing requests.

### 3. Show Power in Approval Dialog
Display the requested power requirements in the approval dialog alongside LOA, beam, and draft specs to help with slip assignment decisions.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/marina/ReservationRequestSheet.tsx` | Always show power selector with standard options; remove marina-conditional logic |
| `src/components/marina/ReservationManager.tsx` | Add power display to reservation cards and approval dialog |

## UI Changes

### Reservation Request Form (Vessel Specs Step)
```text
+----------------------------------+
| Vessel Specifications            |
| LOA: 53ft  |  Beam: 16ft        |
| Draft: 4ft |  Power: 50A        |
+----------------------------------+
| Shore Power Needed *             |
| [   50 Amp (125V)          v ]   | <-- Always visible
+----------------------------------+
```

### Reservation Card (Manager View)
```text
+------------------------------------------+
| Yacht Sea                 [Pending]      |
| HCB Suenos - 53ft                        |
| Owner: John Smith                        |
| Feb 10 - Feb 15    [Transient]           |
| [Zap] 50 Amp (125V)          <-- NEW     |
+------------------------------------------+
```

### Approval Dialog
```text
+------------------------------------------+
| Approve Reservation                      |
|------------------------------------------|
| Yacht Sea                                |
| HCB Suenos - 53ft LOA - 16ft beam        |
| [Zap] Power: 50 Amp (125V)    <-- NEW    |
|------------------------------------------|
| Assign Slip Number                       |
| [ Select a slip...               v ]     |
+------------------------------------------+
```

## Implementation Details

### Power Options Constant
Define a reusable constant for standard shore power types:
```typescript
const SHORE_POWER_OPTIONS = [
  { value: "none", label: "No shore power needed" },
  { value: "30A", label: "30 Amp (120V)" },
  { value: "50A-125V", label: "50 Amp (125V)" },
  { value: "50A-250V", label: "50 Amp (250V)" },
  { value: "100A-1P", label: "100 Amp (single phase)" },
  { value: "100A-3P", label: "100 Amp (3-phase)" },
];
```

### Pre-population Logic
When the vessel specs step loads, pre-select the power option that matches the boat's stored `shore_power` value if available.

### Required Field
Make the power selection a required field since it's critical for slip assignment.

