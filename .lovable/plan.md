

## Edit Utility Meter Feature

### What You Need
A way to edit meter properties after creation - including name, type, meter number, assigned slip, and rate per unit.

### Current State
- **SlipSettings.tsx**: Has a create form but no edit functionality. Each meter row only shows an active/inactive toggle.
- **useYardAssets.ts**: Already has an `updateMeter(id, updates)` function ready to use.

### Solution

Add an edit button to each meter row that opens a pre-populated form sheet, allowing changes to all meter properties.

### Changes to `src/components/slips/SlipSettings.tsx`

1. **Add state for editing**:
   - `editingMeter: UtilityMeter | null` to track which meter is being edited

2. **Add Edit button to each meter row**:
   - Place a Pencil icon button next to the active/inactive switch
   - Clicking opens the form sheet with pre-populated values

3. **Modify the Sheet to handle both Create and Edit modes**:
   - Title changes based on mode: "Add Utility Meter" vs "Edit Meter"
   - Form fields populate from `editingMeter` when in edit mode
   - Submit button label changes: "Create Meter" vs "Save Changes"

4. **Add handleUpdateMeter function**:
   ```typescript
   const handleUpdateMeter = async () => {
     if (!editingMeter || !meterForm.meter_name || !meterForm.rate_per_unit) return;
     setSubmitting(true);
     try {
       await updateMeter(editingMeter.id, {
         meter_name: meterForm.meter_name,
         meter_type: meterForm.meter_type,
         meter_number: meterForm.meter_number || null,
         yard_asset_id: meterForm.yard_asset_id || null,
         rate_per_unit: parseFloat(meterForm.rate_per_unit),
         current_reading: parseFloat(meterForm.current_reading) || 0,
       });
       closeForm();
     } finally {
       setSubmitting(false);
     }
   };
   ```

5. **Update form submission logic**:
   - Check if `editingMeter` is set
   - If editing: call `handleUpdateMeter`
   - If creating: call existing `handleCreateMeter`

6. **Add form reset/close helper**:
   ```typescript
   const closeForm = () => {
     setShowMeterForm(false);
     setEditingMeter(null);
     setMeterForm({
       meter_name: "",
       meter_type: "power",
       meter_number: "",
       yard_asset_id: "",
       rate_per_unit: "",
       current_reading: "0",
     });
   };
   ```

7. **Pre-populate form when editing**:
   ```typescript
   const openEditForm = (meter: UtilityMeter) => {
     setMeterForm({
       meter_name: meter.meter_name,
       meter_type: meter.meter_type,
       meter_number: meter.meter_number || "",
       yard_asset_id: meter.yard_asset_id || "",
       rate_per_unit: meter.rate_per_unit.toString(),
       current_reading: meter.current_reading.toString(),
     });
     setEditingMeter(meter);
     setShowMeterForm(true);
   };
   ```

### UI Changes

**Meter row (before)**:
```
[Icon] Meter Name          Rate    Toggle
        Slip A-12 • #123   $0.15/kWh  [Switch]
```

**Meter row (after)**:
```
[Icon] Meter Name          Rate    [Edit] Toggle
        Slip A-12 • #123   $0.15/kWh  [Pencil] [Switch]
```

### Files to Modify
1. `src/components/slips/SlipSettings.tsx` - Add edit button and dual-mode form logic

