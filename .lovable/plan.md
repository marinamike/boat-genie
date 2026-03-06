

## Problem

When a provider submits a quote on a lead (wish), the wish status changes to "reviewed" but the fetch query still includes "reviewed" wishes: `.in("status", ["submitted", "reviewed", "approved"])`. So the lead keeps appearing as actionable — the provider can quote it again.

The user wants:
1. After quoting, the lead should show as **"Pending"** (awaiting customer response), not as a new lead to accept
2. It should NOT be added to the yard calendar until the customer accepts the quote

## Plan

### 1. Track quoted wish IDs in `useJobBoard.ts`
- After fetching wishes, also fetch `work_orders` where `provider_id = current user` and `status = 'pending'` (quote submitted, awaiting acceptance)
- Cross-reference these with wishes by `boat_id` + service type to identify which wishes this provider has already quoted
- Split wishes into two arrays: `availableWishes` (new leads) and `pendingQuotedWishes` (already quoted by this provider)
- Export both from the hook

### 2. Update `LeadStream.tsx` to show two sections
- **New Leads** section: actionable cards with "Accept Job" / "Submit Quote" buttons (existing behavior)
- **Pending Leads** section: read-only cards showing a "Quote Pending" badge and the submitted quote details, with no action button — just a status indicator that the customer hasn't responded yet

### 3. Update badge count in `ServiceDashboard.tsx`
- The leads tab badge should only count truly new/actionable leads, not pending ones

No database migration needed — this is purely a filtering and UI change using existing data.

