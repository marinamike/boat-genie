

## Plan: Add Type Coercion + Debug Logging to Tier Matching

### Context

`min_length` / `max_length` come back from Supabase as `numeric` columns. The JS client typically returns these as JS `number`s, but in some cases (especially when the column is `numeric` rather than `int`/`float8`) they can come through as **strings**. If that happens, comparisons like `boatLength >= p.minLength` silently misbehave (string vs number coercion), which would explain tiers not matching even when values look right.

### Changes to `src/components/provider/LeadStream.tsx`

#### 1. Explicit `Number()` coercion when building the pool

In `fetchMenuItems`, where the pool array is constructed from the fetched menu rows, normalize `min_length` and `max_length`:

```ts
const pool: LineItemState[] = (data ?? []).map((item) => ({
  // ...existing fields
  minLength:
    item.min_length === null || item.min_length === undefined
      ? null
      : Number(item.min_length),
  maxLength:
    item.max_length === null || item.max_length === undefined
      ? null
      : Number(item.max_length),
}));
```

`Number(null)` → `0`, which is why we explicitly preserve `null` instead of blindly coercing.

#### 2. Debug logging inside `lengthMatches`

Add a `console.log` at the top of `lengthMatches` to surface the actual runtime values and types:

```ts
const lengthMatches = (p: LineItemState) => {
  if (boatLength == null) return true;
  const minOk = p.minLength == null || boatLength >= p.minLength;
  const maxOk = p.maxLength == null || boatLength <= p.maxLength;
  console.log("[QuickQuote tier match]", {
    boatLength,
    name: p.name,
    minLength: p.minLength,
    maxLength: p.maxLength,
    minOk,
    maxOk,
    types: {
      boatLength: typeof boatLength,
      minLength: typeof p.minLength,
      maxLength: typeof p.maxLength,
    },
  });
  return minOk && maxOk;
};
```

Logging `typeof` for each value will immediately confirm whether the suspected string-vs-number issue is real.

### Files Changed

- `src/components/provider/LeadStream.tsx` — `Number()` coercion when mapping pool items + debug `console.log` in `lengthMatches`

No DB, hook, or schema changes. Logging is intended as a diagnostic — once we confirm the cause we can remove it in a follow-up.

