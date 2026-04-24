

## Plan: Auto-Add Emergency Service Fee to QuickQuoteDialog

### Context

In `src/components/provider/LeadStream.tsx`, `fetchMenuItems` (lines 324–419) builds the menu pool and pre-populates `lineItems` based on the requested service + tier-matching logic. Wishes already carry an `is_emergency` flag (used for the lead card badge on line 143). Today, even when an emergency wish opens the quote dialog, the provider has to manually add any "Emergency Service Fee" menu item.

### Change

After the existing tier-aware auto-selection block (lines 379–410) sets the initial `lineItems`, append an extra emergency-fee line item when applicable.

#### Logic

```ts
// After the existing if/else chain that sets initial lineItems:
if (wish?.is_emergency) {
  const emergencyFee = pool.find(
    (p) => p.name.trim().toLowerCase() === "emergency service fee"
  );
  if (emergencyFee) {
    setLineItems((prev) => [
      ...prev,
      { ...emergencyFee, id: nextId(), included: true, quantity: 1, poolId: emergencyFee.id },
    ]);
  }
}
```

#### Behavior

- **Emergency wish + business has "Emergency Service Fee" on menu** → fee is appended as a second pre-populated line item (included, quantity 1, price from menu).
- **Emergency wish + no matching menu item** → no-op (silent; provider can still add manually).
- **Non-emergency wish** → no change.
- **Match is case-insensitive** and trims whitespace, but requires the exact phrase "Emergency Service Fee" — no fuzzy matching.
- **Ambiguous-tier branch** (where `lineItems` is set to `[]` and the hint banner shows) still gets the emergency fee appended on its own — the banner remains visible until the provider also picks the service tier, which is correct UX.

#### Placement

The emergency-fee block goes inside `fetchMenuItems`, immediately after the closing brace of the tier-selection `if/else` chain (after line 410), still inside the `try` block so the `catch` resets cleanly on error.

The functional `setLineItems((prev) => [...prev, …])` form ensures it appends to whatever the prior branch set, including the empty array from the ambiguous-tier branch.

### Why no list-card UI changes are needed

The lead card on line 143 already shows the "Emergency" badge via `wish.is_emergency`. The user's second paragraph ("the emergency fee should appear automatically without the provider having to add it manually") is satisfied entirely by the `fetchMenuItems` change — when the dialog opens, the line item is already there. No card-side rendering change is required.

### Files Changed

- `src/components/provider/LeadStream.tsx` — add the emergency-fee append block at the end of the tier-selection logic in `fetchMenuItems`.

No DB, hook, schema, or type changes. Relies on the business having a menu item literally named "Emergency Service Fee" (case-insensitive).

