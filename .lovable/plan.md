

## Plan

Remove the module checkboxes from `BusinessSetupForm`, add `ModuleManager` below the form in the Profile tab, and delete the Modules tab.

### Changes

**1. `src/components/business/BusinessSetupForm.tsx`**
- Remove the `MODULE_OPTIONS` array, `selectedModules` state, `toggleModule` function, and the entire "Select Modules to Enable" section (lines 145-187)
- Remove `enabled_modules` from both the update and insert calls — modules are now managed solely via `ModuleManager`
- Remove unused imports: `Checkbox`, `Ship`, `Wrench`, `Fuel`, `Store`, and the `BusinessModule`/`ModuleOption` types

**2. `src/pages/BusinessSettings.tsx`**
- In the Profile tab content, render `<BusinessSetupForm />` followed by `<ModuleManager />` 
- Remove the Modules `TabsTrigger` and `TabsContent`
- Remove the `Puzzle` icon import (no longer needed)

Result: 7 tabs remain — Profile (with business info + module toggles), Staff, Service, Slips, Fuel, Store, Account.

