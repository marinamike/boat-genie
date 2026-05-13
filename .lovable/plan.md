## Plan: Wire `business_fees` + emergency-fee toggle into QuickQuoteDialog

### Context

`src/components/provider/LeadStream.tsx` `QuickQuoteDialog` currently auto-adds an emergency fee by name-matching `"Emergency Service Fee"` inside `business_service_menu` (lines ~412-429). We want it driven by `businesses.emergency_fee_enabled` / `emergency_fee_amount`, expose ad-hoc fees from `business_fees`, and render percentage fees with an "Apply to" target plus a correct dollar line total.

### Changes — `src/components/provider/LeadStream.tsx` only

#### 1. Extend `LineItemState`

```ts
isFee?: boolean;        // emergency fee or business_fees item
appliesTo?: string;     // "total" | another lineItem.id (percentage fees only)
```

`isCustom` stays as today (true only for the free-text Custom Item).

#### 2. Replace emergency-fee auto-add (lines ~412-429)

In the dialog's open-effect, fetch the business row alongside the menu pool:

```ts
const { data: biz } = await supabase
  .from("businesses")
  .select("emergency_fee_enabled, emergency_fee_amount")
  .eq("id", businessId)
  .maybeSingle();

if (wish?.is_emergency && biz?.emergency_fee_enabled) {
  setLineItems((prev) => [...prev, {
    id: nextId(),
    name: "Emergency Service Fee",
    pricingModel: "fixed",
    quantity: 1,
    unitPrice: Number(biz.emergency_fee_amount) || 0,
    included: true,
    isCustom: false,
    isFee: true,
  }]);
}
```

Drop the `pool.find(... "emergency service fee")` block.

#### 3. Fetch active `business_fees`

In the same effect:

```ts
const { data: feeRows } = await supabase
  .from("business_fees")
  .select("id, name, pricing_model, amount")
  .eq("business_id", businessId)
  .eq("is_active", true)
  .order("name");
setBusinessFees(feeRows || []);
```

New state: `businessFees: { id, name, pricing_model, amount }[]`.

#### 4. Replace single Custom Item button with two buttons

Two side-by-side buttons in the existing add-row (lines ~700-709):

- **Add Fee** — `Select`-as-trigger (same pattern already used for "Add Menu Item"), populated from `businessFees`. Each option label: `"{name} — {amount}%"` for percentage fees, `formatPrice(amount)` otherwise.
- **Add Custom Item** — unchanged behavior (`addCustomItem`).

`addFromFee(feeId)`:

```ts
const fee = businessFees.find((f) => f.id === feeId);
if (!fee) return;
setLineItems((prev) => [...prev, {
  id: nextId(),
  name: fee.name,
  pricingModel: fee.pricing_model,        // fixed | hourly | per_foot | percentage
  quantity: fee.pricing_model === "per_foot" && boatLength ? boatLength : 1,
  unitPrice: Number(fee.amount) || 0,
  included: true,
  isCustom: false,
  isFee: true,
  appliesTo: fee.pricing_model === "percentage" ? "total" : undefined,
}]);
```

#### 5. Percentage-fee inline target selector

Inside the line-item card, when `li.isFee && li.pricingModel === "percentage"`:

- Replace the qty input label with `%` and bind to `unitPrice` (stored as raw percent number, e.g. `3` for 3%); force `quantity = 1` and hide the `×$` input.
- Render an inline "Apply to" `Select` with options:
  - `"Quote Total"` (value `"total"`, default)
  - Every other current line item that is **not** itself a percentage fee, labeled by its `name`.
- Updating the select writes `appliesTo` on that line item.

#### 6. `runningTotal` and per-line display use `computeLineTotal`

Define once in the component:

```ts
const baseItems = lineItems.filter((li) => !(li.isFee && li.pricingModel === "percentage"));
const baseTotal = baseItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

const computeLineTotal = (li: LineItemState): number => {
  if (li.isFee && li.pricingModel === "percentage") {
    const pct = Number(li.unitPrice) || 0;
    if (!li.appliesTo || li.appliesTo === "total") return (baseTotal * pct) / 100;
    const target = lineItems.find((x) => x.id === li.appliesTo);
    return target ? (target.quantity * target.unitPrice * pct) / 100 : 0;
  }
  return li.quantity * li.unitPrice;
};

const runningTotal = lineItems.reduce((s, li) => s + computeLineTotal(li), 0);
```

**Critical (per latest user feedback):** the per-line dollar amount rendered in the quote form (currently `formatPrice(li.quantity * li.unitPrice)` at line ~656) MUST be replaced with `formatPrice(computeLineTotal(li))` for **every** line item — not just non-percentage rows. So a 3% fee on a $1,700 quote shows `$51.00`, not `$3.00`.

`handleSubmit`'s per-item `lineTotal` (line ~532) likewise uses `computeLineTotal(li)` so the persisted quote matches the displayed amount. `isCustom` in the submit payload stays as today (fees → `false`).

#### 7. Visual differentiation for fees

Card class varies by `isFee` (amber accent for fees, primary for menu items) using `cn(...)` from `@/lib/utils`.

### Out of scope

- No DB / RLS changes.
- `useBusinessFees` hook intentionally not reused — the dialog needs `businessId` from the wish (admin/staff context may differ from `useBusiness().business?.id`); keep the inline fetch consistent with the menu fetch already in this file.
- Downstream `QuoteLineItem` shape unchanged; percentage fees ship with their computed `lineTotal` so consumers stay unchanged.

### Files Changed

- `src/components/provider/LeadStream.tsx` — `LineItemState` extension, emergency-fee + business_fees fetch, two-button add row, `addFromFee`, percentage `Apply to` selector with `%` input, `computeLineTotal` used by per-line display, `runningTotal`, and submit payload, fee styling.