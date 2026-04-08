

## Plan: Pre-populate requested service and add "Add Menu Item" flow

### Summary
Change QuickQuoteDialog so the requested service appears as the first included line item on open, instead of showing all menu items as unchecked checkboxes. Add an "Add Menu Item" button with a dropdown to pick additional items from the business menu.

### Changes to `src/components/provider/LeadStream.tsx`

**1. Store fetched menu items separately from line items**
- Add `menuPool` state (`LineItemState[]`) to hold the full list of fetched menu items for the category (used as the source for the "Add Menu Item" dropdown)
- `lineItems` state now only holds items actually added to the quote

**2. Rewrite `fetchMenuItems` logic (useEffect)**
- Fetch all active menu items for the category into `menuPool`
- Find the item in `menuPool` matching `wish.service_name` exactly
- If found: create one line item from it — `included: true`, quantity = boat length for per_foot else 1, price from menu
- If not found: create a custom line item with `name = wish.service_name`, `unitPrice = 0`, `included: true`, `isCustom: true`
- Set `lineItems` to just this one item (not the full menu list)

**3. Replace the all-items checkbox list with included-items-only list**
- Render only `lineItems` (all are included by default). Remove the checkbox toggle — each item is always included once added
- Keep the existing row UI: name (editable if custom), pricing model badge, quantity, unit price, line total, remove button
- All items get a remove button (not just custom ones)

**4. Add "Add Menu Item" button with dropdown**
- Below the line items, show three buttons: "Add Menu Item", "Add Diagnostic Fee", "Add Custom Item"
- "Add Menu Item" uses a `<Select>` dropdown populated from `menuPool`, filtering out items already in `lineItems` by name
- On select: add the chosen menu item as a new line item with `included: true`, pre-filled quantity/price (per_foot uses boat length)
- If all menu items are already added, disable the button

**5. Minor cleanup**
- Remove `toggleIncluded` function (no longer needed)
- Remove `Checkbox` import if unused elsewhere
- Update `includedItems` computed — since all line items are now included, just use `lineItems` directly for total and submit
- Update submit disabled check: `lineItems.length === 0` instead of `includedItems.length === 0`

### Files changed
- `src/components/provider/LeadStream.tsx` — QuickQuoteDialog rewrite

