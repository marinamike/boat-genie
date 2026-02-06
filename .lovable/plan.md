
## What’s actually happening (root cause)
The crash is coming from the Radix Checkbox component when it is **controlled** (`checked={...}`) and its value is changed by a **parent click handler** inside a `<form>`. This is a known failure mode that produces the exact stack you’re seeing (`setRef` / `composeRefs` / “Maximum update depth exceeded”).

In your `BusinessSetupForm`, each module option is rendered like this:
- A parent `<div onClick={() => toggleModule(...) }>` changes React state
- Inside that parent is a controlled Radix `<Checkbox checked={isSelected} ... />`

Clicking the option causes the parent click → state update → Checkbox rerender/ref churn → Radix ref composition loops → React throws “Maximum update depth exceeded” and you get a blank screen.

## Goal
Keep the same UI (clickable module tiles with a checkbox indicator), but remove the “parent click drives controlled Radix checkbox” pattern that triggers the infinite loop.

## Proposed fix (safe + minimal behavioral change)
Refactor the module picker so that:
1) The checkbox itself is the interaction source via `onCheckedChange`
2) The tile is still clickable by using a `<label>`/`htmlFor` relationship (so clicking anywhere toggles the checkbox)
3) Remove the parent `onClick` handler entirely

This mirrors how your `MarinaRegistrationForm` already uses Checkbox safely:
- `checked={isSelected}`
- `onCheckedChange={() => handleToggle(...)}`
(no parent click handler driving the state)

## Files to change
### 1) `src/components/business/BusinessSetupForm.tsx`
Update the module options rendering:

- Remove:
  - `onClick={() => toggleModule(module.id)}` from the wrapper
  - `pointer-events-none` from the Checkbox (we want the Checkbox to receive events)
- Add:
  - A stable `id` for each checkbox, e.g. `id={`module-${module.id}`}`
  - `onCheckedChange={() => toggleModule(module.id)}`
  - Wrap the whole tile in a `<label htmlFor=...>` (or a `<Label asChild>` pattern if you prefer) so the entire tile toggles the checkbox without a parent click handler.

Implementation shape (conceptual):
```tsx
const checkboxId = `module-${module.id}`;

<label
  htmlFor={checkboxId}
  className={...tile classes depending on isSelected...}
>
  <Checkbox
    id={checkboxId}
    checked={isSelected}
    onCheckedChange={() => toggleModule(module.id)}
    className="mt-1"
  />
  ...rest of tile content...
</label>
```

Notes:
- Keeping the state update inside `onCheckedChange` avoids the Radix controlled-checkbox + parent click loop.
- Using `label/htmlFor` preserves the “click anywhere in the tile” UX.

## Validation / testing steps
1) Go to `/business/settings` while you have no business created yet (so the setup form is visible).
2) Click each module tile repeatedly (single + rapid clicks):
   - The checkbox UI should toggle reliably
   - No blank screen
   - No console error
3) Fill in business name and submit:
   - Business should be created with `enabled_modules` matching the selected tiles
4) Quick regression check:
   - Visit any other screen using checkboxes (e.g. Marina registration amenities, staff permissions) to ensure no side effects.

## Optional hardening (if you want extra safety)
If you still ever see ref-related loops with Radix checkboxes elsewhere, a fallback approach is to use a simple native checkbox for this specific “tile picker” UI. But the label + onCheckedChange approach should resolve it cleanly without replacing components.

## Why this will fix it
It removes the exact trigger condition:
- “Controlled Radix checkbox inside a form where a parent click triggers the controlled value change”
and replaces it with:
- “Controlled Radix checkbox manages the change event itself (onCheckedChange)”
which is the recommended controlled pattern and matches working areas of your codebase.

(Reference: Radix primitives issue reports describe this specific infinite loop scenario with controlled checkboxes in forms when a parent click changes state.)
