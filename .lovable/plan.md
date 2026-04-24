

## Plan: Add "Fees" Tab to Business Settings

### Context

The migration introduced two emergency-fee columns on `businesses` and the `business_fees` table, but no UI exists yet to manage them. The `BusinessContext` currently does **not** expose `emergency_fee_enabled` / `emergency_fee_amount` — its `Business` interface needs to include them so they survive `refreshBusiness()`. `BusinessSettings.tsx` already has a horizontally-scrolling tab pattern we can extend with a "Fees" tab.

### Changes

#### 1. `src/contexts/BusinessContext.tsx` — extend `Business` interface

Add the two new columns so the context returns them after the migration:

```ts
interface Business {
  // ...existing fields
  emergency_fee_enabled?: boolean;
  emergency_fee_amount?: number;
}
```

No fetch logic change needed — `select("*")` already pulls them.

#### 2. New hook `src/hooks/useBusinessFees.ts`

A single hook that handles both halves of the Fees tab:

**Emergency-fee management** (operates on `businesses` row):
- `emergencyFeeEnabled`, `emergencyFeeAmount` — derived from `useBusiness().business`
- `updateEmergencyFee({ enabled, amount })` → updates `businesses` row by id, then calls `refreshBusiness()`

**Custom-fee CRUD** (`business_fees` table):
- `fees: BusinessFee[]` — list of fees scoped to current `business.id`
- `loading`
- `fetchFees()` — `.eq('business_id', business.id).order('created_at')`
- `createFee({ name, pricing_model, amount, is_active })`
- `updateFee(id, partial)` — supports `{ pricing_model, amount, is_active }` (name omitted in edit mode)
- `deleteFee(id)`
- `toggleActive(id, current)` — convenience over `updateFee`

`BusinessFee` type defined locally:
```ts
type PricingModel = "fixed" | "hourly" | "per_foot" | "percentage";
interface BusinessFee {
  id: string;
  business_id: string;
  name: string;
  pricing_model: PricingModel;
  amount: number;
  is_active: boolean;
  created_at: string;
}
```

All mutations use `useToast` for success/error feedback and refetch the list. Hook bails out gracefully (returns empty list, no-op mutations) when `business` is null.

#### 3. New component `src/components/business/FeesSetupTab.tsx`

The tab body, broken into two cards.

**Card 1 — Emergency Service Fee**
- `Switch` bound to `emergencyFeeEnabled`
- When toggle is ON, reveal a numeric `Input` ($ prefix) bound to `emergencyFeeAmount`
- "Save" button calls `updateEmergencyFee({ enabled, amount })`
- Both inputs initialized from `business` on mount via `useEffect`
- Helper text: "Automatically added to quotes for emergency service requests."

**Card 2 — Custom Fees Library**
- Header with "Add Fee" button (hidden while inline form is open)
- Inline form (mirrors `ServiceMenuManager`'s pattern) with:
  - **Name** (text input) — disabled in edit mode
  - **Pricing Model** (`Select`: Fixed, Hourly, Per Foot, Percentage)
  - **Amount** (numeric input) — label dynamically reads `Amount ($)` for fixed/hourly/per_foot, `Amount (%)` for percentage
  - **Active** toggle (defaults to true)
  - Save / Cancel buttons
- Fee list rows: name + pricing-model `Badge` + amount (formatted as `$X.XX` or `X%`) + active `Switch` + edit pencil + delete trash icon (with `AlertDialog` confirm)
- Empty state: "No custom fees yet. Add one to get started."
- Greys out (`opacity-50`) inactive rows, matching `ServiceMenuManager` UX

Pricing model labels:
```ts
const PRICING_MODELS = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "per_foot", label: "Per Foot" },
  { value: "percentage", label: "Percentage" },
];
```

#### 4. `src/pages/BusinessSettings.tsx` — register the new tab

- Import `FeesSetupTab` and a `DollarSign` icon from `lucide-react`
- Add a `<TabsTrigger value="fees">` between **Store** and **Staff** with the icon + "Fees" label
- Add matching `<TabsContent value="fees">` rendering `<FeesSetupTab />`

The tabs list is already inside a horizontal `ScrollArea`, so adding one more trigger requires no layout change.

### Behavior Notes

- **Permissions**: RLS already restricts `business_fees` writes to owner/staff/platform-admin, and `businesses` updates are owner-only. The Fees tab is reachable from the existing settings page, which is already gated by `useBusiness`. No additional client-side gating needed for v1 — owners use it; staff get a clean RLS error if they try to mutate (consistent with how `ModuleManager` works).
- **Wiring into LeadStream is out of scope** — this task is the management UI only. The auto-add logic in `LeadStream.tsx` still uses the menu-item name match; replacing it with `emergency_fee_enabled` / `emergency_fee_amount` is a separate follow-up.
- **No migration needed** — schema landed in the previous step.

### Files Changed

- `src/contexts/BusinessContext.tsx` — add `emergency_fee_enabled` / `emergency_fee_amount` to the `Business` interface
- `src/hooks/useBusinessFees.ts` (new) — emergency-fee getter/setter + `business_fees` CRUD
- `src/components/business/FeesSetupTab.tsx` (new) — two-card UI (emergency fee + custom fees library with inline add/edit form)
- `src/pages/BusinessSettings.tsx` — add "Fees" tab trigger + content

