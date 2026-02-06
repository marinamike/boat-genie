
# Add Custom Rate Toggle for Utility Meters

## Current State
The meter edit form has a simple rate input field where leaving it empty uses the global rate. This is functional but lacks the clear visual toggle that slips have for custom rates.

## Goal
Match the slip rate override UX pattern:
- Add a **"Custom Rate"** toggle switch (like slips have)
- When OFF: Display global rate info, rate field is hidden
- When ON: Show rate input field for custom override
- Clear visual distinction between inherited and custom rates

## Solution: Create MeterEditSheet Component

Similar to `SlipEditSheet`, create a dedicated `MeterEditSheet` component with:
1. **Custom Rate toggle** with Switch component
2. **Global rate preview** when toggle is off
3. **Rate input field** when toggle is on
4. Visual feedback showing current effective rate

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/slips/MeterEditSheet.tsx` | **NEW** - Dedicated meter edit sheet with custom rate toggle |
| `src/components/slips/SlipSettings.tsx` | Replace inline meter form with MeterEditSheet component |

## Component Design: MeterEditSheet

```text
+------------------------------------------+
| Edit Meter                               |
+------------------------------------------+
| Meter Name: [D20 Power       ]           |
| Type: [Power ▼]  Meter #: [12345   ]     |
| Assign to Slip: [D20 ▼]                  |
+------------------------------------------+
| [Separator]                              |
+------------------------------------------+
|                                          |
| Custom Rate                    [Toggle]  |
| Override global rate for this meter      |
|                                          |
| +--------------------------------------+ |
| | If OFF:                              | |
| | This meter uses the global rate:     | |
| | $0.15/kWh (Power)                    | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | If ON:                               | |
| | Rate per kWh                         | |
| | [$0.20              ]                | |
| | Global: $0.15/kWh                    | |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
| Current Reading                          |
| [1234.56                      ]          |
+------------------------------------------+
| [Cancel]              [Save Changes]     |
+------------------------------------------+
```

## Implementation Details

### MeterEditSheet Props
```typescript
interface MeterEditSheetProps {
  meter: UtilityMeter | null;
  assets: YardAsset[];
  meters: UtilityMeter[];
  globalRates: {
    power: number | null;
    water: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<UtilityMeter>) => Promise<boolean>;
  onCreate: (meter: Partial<UtilityMeter>) => Promise<any>;
}
```

### Toggle Logic
```typescript
const [useCustomRate, setUseCustomRate] = useState(false);

// Initialize based on existing meter
useEffect(() => {
  if (meter) {
    setUseCustomRate(meter.rate_per_unit > 0);
  }
}, [meter]);

// On save
const handleSave = async () => {
  const updates = {
    ...formData,
    rate_per_unit: useCustomRate 
      ? parseFloat(form.rate_per_unit) 
      : 0  // 0 signals "inherit global"
  };
  await onUpdate(meter.id, updates);
};
```

### SlipSettings Integration
Replace the inline Sheet with MeterEditSheet:
```typescript
<MeterEditSheet
  meter={editingMeter}
  assets={assets}
  meters={meters}
  globalRates={{
    power: business?.power_rate_per_kwh ?? null,
    water: business?.water_rate_per_gallon ?? null,
  }}
  open={showMeterForm}
  onOpenChange={(open) => !open && closeForm()}
  onUpdate={updateMeter}
  onCreate={createMeter}
/>
```

## UI Behavior

### Toggle OFF (Inherit Global)
- Rate input field hidden
- Display: "This meter uses the global power rate: **$0.15/kWh**"
- Save sets `rate_per_unit = 0`

### Toggle ON (Custom Rate)
- Rate input field visible with placeholder showing global rate
- Helper text: "Global rate: $0.15/kWh"
- Save sets `rate_per_unit = parseFloat(input)`

### Visual Indicators
- Meter cards in list show "Custom" badge when `rate_per_unit > 0`
- Effective rate always displayed (already implemented)

## Database Impact
No schema changes required. The `rate_per_unit = 0` convention already signals inheritance.
