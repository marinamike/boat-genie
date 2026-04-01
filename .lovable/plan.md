

## Plan: Remove provider selection step from WishFormSheet

### Summary
Strip the provider selection step so the wish flow becomes: select-boat → select-category → form → submit. Owners describe what they need without picking a specific business.

### Changes to `src/components/wish/WishFormSheet.tsx`

1. **Remove imports**: `useServiceProviders`, `useProviderServicesByBusiness`, `ServiceProvider` from `useServiceProviders`; `ProviderSearchResults` component; `ProviderService` from `useProviderServices`; `Loader2` icon (if unused elsewhere)

2. **Remove `"select-provider"` from `Step` type** — becomes `"select-boat" | "select-category" | "form" | "find-marina"`

3. **Remove state variables**: `selectedProvider`, `selectedProviderService`

4. **Remove hook calls**: `useServiceProviders(...)` and `useProviderServicesByBusiness(...)`

5. **Remove useEffect** that resets provider/service when category changes (lines 129-133) and useEffect that resets service when provider changes (lines 156-159)

6. **Update category selection click handler** (line 332): change `setStep("select-provider")` → `setStep("form")`

7. **Remove functions**: `handleProviderServiceSelect`, `handleSelectProvider`, `calculateProviderServicePrice`

8. **Simplify `getPriceBreakdown`**: remove the `selectedProviderService` branch — only use platform `serviceRates` via `getMatchingServiceRate`

9. **Simplify `renderForm`**:
   - Remove `useProviderServicesDropdown` logic and the provider services dropdown
   - Replace service selection with a simple dropdown of platform `serviceRates` filtered by category
   - Remove provider name header variant — always show the simple badge header
   - Back button always goes to `"select-category"`
   - Remove provider name display in price breakdown card
   - Remove `loadingServices` spinner

10. **Remove from JSX render** (lines 624-632): the `step === "select-provider"` block rendering `ProviderSearchResults`

11. **Reset state cleanup** (lines 110-120): remove `setSelectedProvider(null)` and `setSelectedProviderService(null)`

