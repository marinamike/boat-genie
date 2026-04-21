

## Plan: Surface Length Range Fields in Service Menu UI

### 1. `src/hooks/useServiceMenu.ts`

Extend the `ServiceMenuItem` interface:

```ts
export interface ServiceMenuItem {
  // ...existing fields
  min_length: number | null;
  max_length: number | null;
}
```

No changes needed to `createMenuItem` / `updateMenuItem` — they already accept `Partial<ServiceMenuItem>` and forward via spread, so the new fields flow through automatically.

### 2. `src/components/business/ServiceMenuManager.tsx`

**Form state** — add `min_length` and `max_length` to the form state (stored as strings for input handling, converted to `number | null` on submit).

**Form UI** — in both the create and edit forms, add a two-column row of numeric inputs after the price field, shown for all pricing models:

```
┌──────────────────┬──────────────────┐
│ Min Length (ft)  │ Max Length (ft)  │
│ [   optional   ] │ [   optional   ] │
└──────────────────┴──────────────────┘
```

- `type="number"`, `min="0"`, `step="0.1"`, `placeholder="Optional"`
- Empty string → `null` on save; numeric string → `parseFloat(value)`

**Submit payload** — include `min_length` and `max_length` in both `createMenuItem` and `updateMenuItem` calls (sending `null` when blank).

**Edit pre-fill** — when opening the edit form, populate the inputs from the existing item's values (convert `null` → `""`).

**List display** — render a size-range badge next to the existing pricing-model badge when either `min_length` or `max_length` is set. Helper:

```ts
function formatLengthRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}-${max}ft`;
  if (max != null) return `Up to ${max}ft`;
  return `${min}ft+`;
}
```

Render as a `<Badge variant="outline">` adjacent to the pricing model badge.

### Files Changed

- `src/hooks/useServiceMenu.ts` — add `min_length` / `max_length` to `ServiceMenuItem` interface
- `src/components/business/ServiceMenuManager.tsx` — form state, inputs, payload, edit pre-fill, list badge

