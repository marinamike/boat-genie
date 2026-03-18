
# Cancellation Policy for Accepted Quotes

## Overview
After a customer accepts a provider's quote, cancellation will require acknowledging the provider's cancellation policy and associated fee. Providers will configure their cancellation policy message and rate in their business profile.

## Changes

### 1. Database Migration
Add two new columns to the `businesses` table:
- `cancellation_policy_message` (text, nullable) -- Custom message shown to customers before cancellation (e.g., "Cancellations after acceptance are subject to a fee to cover scheduling and materials costs.")
- `cancellation_fee_percent` (numeric, nullable) -- Percentage of the quote total charged on cancellation (e.g., 25 means 25%)

### 2. Provider Profile Form (`ProviderProfileForm.tsx`)
Add a new "Cancellation Policy" card section with:
- A textarea for the cancellation policy message
- A numeric input for the cancellation fee percentage
- Wire these fields into the existing form save logic via `useProviderProfile`

### 3. Provider Profile Hook (`useProviderProfile.ts`)
- Add `cancellation_policy_message` and `cancellation_fee_percent` to the `ProviderProfile` interface
- Map these fields in fetch, create, and update functions

### 4. Quote Acceptance Flow -- Cancellation Gate (`WishDetailDialog.tsx`)
When a customer tries to cancel an **accepted** wish (work order status is `assigned` or `in_progress`):
- Fetch the provider's cancellation policy from the `businesses` table (via the work order's `provider_id`)
- Show a cancellation confirmation dialog that displays:
  - The provider's custom cancellation policy message
  - The calculated cancellation fee (percentage of the escrow/quote total)
  - A checkbox "I acknowledge this cancellation fee"
- The "Confirm Cancellation" button remains disabled until the checkbox is checked
- If no cancellation policy is configured by the provider, show a default message with no fee

### 5. Quote Acceptance Flow -- Post-Acceptance Cancel (`PendingQuotesSection.tsx`)
Currently, cancellation of accepted work is handled in `WishDetailDialog`. The `isPending` check already gates the cancel button. We need to also allow cancellation for `approved`/`in_progress` statuses but with the policy gate. Update the dialog to:
- Show "Cancel Service" button for accepted/in-progress wishes (not just pending ones)
- Route through the cancellation policy acknowledgment flow

## Technical Details

```text
Flow:
  Customer clicks "Cancel" on accepted wish
       |
       v
  Fetch provider's business record (cancellation_policy_message, cancellation_fee_percent)
       |
       v
  Show AlertDialog with:
    - Policy message text
    - "Cancellation fee: $X.XX (Y% of $Z.ZZ)"
    - Checkbox: "I acknowledge and accept the cancellation fee"
       |
       v
  On confirm: Update work_order status to 'cancelled', 
              wish_forms status to 'rejected'
```

### Files to modify:
- **Migration**: Add `cancellation_policy_message` and `cancellation_fee_percent` columns to `businesses`
- `src/hooks/useProviderProfile.ts`: Add new fields to interface and CRUD mapping
- `src/components/provider/ProviderProfileForm.tsx`: Add cancellation policy card
- `src/components/owner/WishDetailDialog.tsx`: Add policy-gated cancellation for accepted wishes
