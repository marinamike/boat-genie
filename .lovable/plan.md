

## Plan

Inline profile details (name, phone, email) directly into the Account tab of `BusinessSettings.tsx`, removing the "Edit Profile" button. No billing section, no account type/role selector.

### Changes

**`src/pages/BusinessSettings.tsx`**

- Add state for `fullName`, `phone`, `saving`, plus a `useEffect` to fetch profile data from `profiles` table
- Add `handleSave` function to update `full_name` and `phone` on the `profiles` table
- Replace the Account tab content with:
  1. **Profile Details card** — email (disabled), full name (editable), phone (editable), Save button
  2. Platform Admin button (conditional, unchanged)
  3. Sign Out button (unchanged)
- Remove the "Edit Profile" navigate button and one `Separator`
- Add imports: `Input`, `Label`, `Save`, `Loader2`, `useState`, `useEffect`

### Account tab layout

```text
Card: "Profile Details"
  - Email (read-only)
  - Full Name (input)
  - Phone (input)
  - [Save Changes] button
---
[Platform Admin] (if admin email)
---
[Sign Out]
```

