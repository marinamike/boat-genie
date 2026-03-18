

## Remove Add Slip/Space from DockGrid

### Changes — single file: `src/components/slips/DockGrid.tsx`

1. **Remove imports**: `Plus`, `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`, `AssetForm`
2. **Remove props**: `createAsset` and `deleteAsset` from `DockGridProps` (only needed by the add form)
3. **Remove state**: `showAddForm`
4. **Remove the "Add Slip/Space" button** (~line 145-148)
5. **Replace the empty-state CTA** (~line 194-201) with a message directing staff to the Settings tab instead of an add button
6. **Remove the Sheet/AssetForm block** (~line 276-289)

No other files modified. The `createAsset` and `deleteAsset` props are still passed from `SlipsDashboard` via `useYardAssets` spread but will simply be unused/ignored — no changes needed there.

