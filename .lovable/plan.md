

## Plan: Merge Compliance Tab Into Account Tab

### Context

`src/pages/BusinessSettings.tsx` currently has two separate tabs:
- **Account** — Profile (business name, address, email, name, phone), `ModuleManager`, Platform Admin button (conditional), Sign Out
- **Compliance** — `InsuranceVaultForm`, `TaxInfoForm`, `BankSetupForm`, `TermsAcceptanceForm`

User wants these combined under a single "Account" tab.

### Changes

**File: `src/pages/BusinessSettings.tsx`**

1. **Remove the Compliance `TabsTrigger`** (the one with `ClipboardCheck` icon, value `"compliance"`).
2. **Remove the `<TabsContent value="compliance">` block** entirely.
3. **Move the four compliance forms into the Account tab content**, placed after `ModuleManager` and before the `Separator` / Platform Admin / Sign Out section. Order preserved:
   - `InsuranceVaultForm`
   - `TaxInfoForm`
   - `BankSetupForm`
   - `TermsAcceptanceForm`
4. **Drop the `ClipboardCheck` import** from `lucide-react` since it's no longer used.

### Resulting Account Tab Structure

```
Profile Card (business + personal info + Save)
ModuleManager
InsuranceVaultForm
TaxInfoForm
BankSetupForm
TermsAcceptanceForm
Separator
[Platform Admin button — if applicable]
Sign Out button
```

### Notes

- Final tab list (in order): Account, Slips, Service, Fuel, Store, Fees, Staff — 7 tabs, still fits the existing horizontally-scrolling `ScrollArea` pattern.
- No changes to the compliance form components themselves — they keep their own card styling and stack naturally.
- No DB, hook, or routing changes.

### Files Changed

- `src/pages/BusinessSettings.tsx` — remove Compliance trigger + content, move four forms into Account tab, drop unused `ClipboardCheck` import.

