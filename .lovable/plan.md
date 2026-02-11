
# Add "Earliest Availability" Checkbox to Wish Form

## Change

In `src/components/wish/WishFormSheet.tsx`, add a checkbox below the date picker labeled **"Earliest availability"**. When checked, the date picker is disabled and the submission sends `"earliest"` as the preferred date.

## File: `src/components/wish/WishFormSheet.tsx`

1. **New state** (near line 60): `const [earliestAvailability, setEarliestAvailability] = useState(false);`

2. **Add checkbox UI** (after the date input, around line 557): Insert a `Checkbox` + `Label` reading "Earliest availability". When checked, disable and clear the date input.

3. **Disable date input when checked**: Add `disabled={earliestAvailability}` and reduced opacity class to the date `Input`.

4. **Submission logic** (line ~269): Set `preferredDate` to `"earliest"` when checkbox is on, otherwise use the date value.

5. **Reset logic** (line ~116): Add `setEarliestAvailability(false)` to the reset function.

## Technical Details

New imports needed: `Checkbox` from `@/components/ui/checkbox`.

UI layout after change:

```text
Preferred Date (Optional)
[ date input — disabled when checkbox checked ]
[x] Earliest availability
```
