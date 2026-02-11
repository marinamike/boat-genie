
# Add Lead Stream Tab to Service Dashboard

## Problem

The Lead Stream (where submitted customer wishes appear) is only rendered on the legacy Provider Dashboard (`/provider`). Since the business role uses `/business/jobs` (the `ServiceDashboard`), there is no way to see incoming leads from that route.

## Solution

Add a "Leads" tab to the `ServiceDashboard` page that integrates the existing `LeadStream` component and `useJobBoard` hook.

## Changes

### 1. `src/pages/ServiceDashboard.tsx`

- Import `useJobBoard` hook and `LeadStream` component
- Import `useProviderMetrics` for the `providerServices` data that `LeadStream` requires
- Add a new "Leads" tab (with a `Briefcase` icon) to the existing tab bar, making it 7 columns
- Render the `LeadStream` component inside the new tab content, passing `availableWishes`, `providerServices`, `submitQuote`, and `submittingQuote`
- Show a lead count badge on the tab trigger when leads are available

### UI Layout After Change

```text
Tab bar: [Jobs] [Leads] [Yard] [QC] [On Blocks] [Staff] [Setup]
```

The Leads tab will show the same lead cards currently visible on the Provider Dashboard -- service type, boat specs, pricing breakdown, and Accept/Quote buttons.

## Technical Details

- `useJobBoard()` provides `availableWishes`, `submittingQuote`, and `submitQuote`
- `useProviderMetrics()` provides `providerServices` (needed by `LeadStream` for service matching)
- Both hooks already use the `BusinessContext` internally, so they will work within the `/business` route
- No database or migration changes required
- No new components needed -- reusing existing `LeadStream` from `src/components/provider/LeadStream.tsx`
