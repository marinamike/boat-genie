

## Problem

The "Profile" tab in Business Settings shows the "Set Up Your Business" creation form with empty fields, even though your business (Marina Mike's) already exists. The `BusinessSetupForm` component only handles initial creation -- it never loads or edits existing data.

## Solution

Convert `BusinessSetupForm` into a dual-purpose component that detects whether a business already exists and switches between create mode and edit mode accordingly.

### Changes

**1. Update `BusinessSetupForm.tsx`**
- Import `useBusiness` context to detect existing business
- Pre-populate fields (business name, address, selected modules) from `business` context when it exists
- Change the header from "Set Up Your Business" to "Business Profile" in edit mode
- Change the submit button from "Create Business" to "Save Changes" in edit mode
- Use `upsert` or `update` instead of `insert` when editing an existing business
- After saving, call `refreshBusiness()` to update context

**2. No changes needed to `BusinessSettings.tsx`**
- The page already correctly renders `BusinessSetupForm` in the Profile tab and gates the setup-only view behind `if (!business)`

### Technical Detail

```text
BusinessSetupForm behavior:
  if (business exists in context):
    - Pre-fill: businessName, address, selectedModules from context
    - Header: "Business Profile" / "Update your business information"
    - Submit: UPDATE businesses SET ... WHERE id = business.id
    - Button: "Save Changes"
  else:
    - Empty form (current behavior)
    - Header: "Set Up Your Business"
    - Submit: INSERT INTO businesses ...
    - Button: "Create Business"
```

