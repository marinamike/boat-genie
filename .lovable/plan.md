

## Plan: Add Info Banner When Auto-Selection Defers to Manual Tier Pick

### Context

In the planned `QuickQuoteDialog` update (in `src/components/provider/LeadStream.tsx`), `lineItems` is intentionally left empty in two branches:

1. **Ambiguous match** — multiple tiers share the service name and >1 (or 0) match the boat length
2. **No match** — boat length doesn't fit any tier's range

Currently the user just sees an empty line items area with no explanation, which looks broken.

### Changes

#### 1. Track the "deferred selection" reason in state

Add a small piece of state alongside `lineItems`:

```ts
const [tierSelectionHint, setTierSelectionHint] = useState<string | null>(null);
```

Set it in the same branch of the `fetchMenuItems` effect that empties `lineItems`:

```ts
// Inside the "multiple tiers" branch when matched.length !== 1
setLineItems([]);
setTierSelectionHint(
  "Multiple pricing tiers found for this service. Please select the correct tier for this boat using the Add Menu Item button below."
);
```

In every other branch (single match, exact length match, custom fallback), explicitly clear it:

```ts
setTierSelectionHint(null);
```

Also clear it whenever the provider adds a line item from the menu picker, so the banner disappears once they make a choice.

#### 2. Render a subtle info banner in the line items section

Just above the line items list (or in place of the empty list), render:

```tsx
{tierSelectionHint && lineItems.length === 0 && (
  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
    <Info className="h-4 w-4 mt-0.5 shrink-0" />
    <span>{tierSelectionHint}</span>
  </div>
)}
```

- Uses `bg-muted/40` + `text-muted-foreground` for a subtle, non-alarming look (not `destructive` styling)
- `Info` icon from `lucide-react`
- Conditional on both the hint being set AND no line items existing, so it auto-hides as soon as the provider picks a tier

### Files Changed

- `src/components/provider/LeadStream.tsx` — add `tierSelectionHint` state, set/clear it in the tier-selection branches, render the info banner above the line items list, import `Info` from `lucide-react` if not already imported

No DB, hook, or schema changes.

