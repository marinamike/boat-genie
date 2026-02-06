

## Smart Slip Assignment with Boat Fit Validation

### What You're Asking For
When approving a reservation, the slip assignment field should be a dropdown showing only slips that:
1. Are available (not currently occupied)
2. Can physically accommodate the boat's dimensions (length, beam, draft)

### Current State
Right now, the "Assign Slip Number" field is a simple text input where you type a slip name manually. The system has all the data needed for smart filtering:

**Boat measurements available:**
- `boats.length_ft` - boat length
- `boat_specs.loa_ft` - length overall (more precise)
- `boat_specs.beam_ft` - width of boat
- `boat_specs.draft_engines_down_ft` - how deep the boat sits

**Slip measurements available:**
- `yard_assets.max_loa_ft` - maximum length the slip can hold
- `yard_assets.max_beam_ft` - maximum width
- `yard_assets.max_draft_ft` - maximum draft/depth
- `yard_assets.is_available` - whether slip is free
- `yard_assets.current_boat_id` - null if empty

### Solution

#### Step 1: Fetch Available Slips
When the Approve dialog opens, query yard_assets for the business to get all slips with their dimensions.

#### Step 2: Filter by Boat Measurements
Compare the boat's specs from the reservation to each slip's max dimensions:
- Boat LOA must be less than or equal to slip's `max_loa_ft`
- Boat beam must be less than or equal to slip's `max_beam_ft`
- Boat draft must be less than or equal to slip's `max_draft_ft`
- Slip must be available (`is_available = true` and `current_boat_id = null`)

#### Step 3: Replace Input with Select Dropdown
The simple text input becomes a dropdown showing:
- Available slips that fit the boat (labeled as "Available - Fits")
- Warning badges for slips that don't fit (optionally shown but disabled)

---

### Technical Changes

**File: `src/components/marina/ReservationManager.tsx`**

1. **Add imports:**
   - Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` components
   - Import `useYardAssets` hook to get slips

2. **Fetch boat specs when dialog opens:**
   - Query `boat_specs` table for the selected reservation's boat
   - Get `loa_ft`, `beam_ft`, `draft_engines_down_ft`

3. **Filter available slips:**
   - Filter `yard_assets` where:
     - `is_available = true`
     - `current_boat_id = null`
     - `max_loa_ft >= boat.loa_ft` (or boat.length_ft as fallback)
     - `max_beam_ft >= boat.beam_ft` (if boat has beam)
     - `max_draft_ft >= boat.draft_ft` (if boat has draft)

4. **Replace Input with Select:**
   - Change the slip assignment from `<Input>` to `<Select>`
   - Show slip name, dock section, and dimensions in dropdown items
   - Show a message if no suitable slips are available

**New State to Add:**
```typescript
const [availableSlips, setAvailableSlips] = useState<YardAsset[]>([]);
const [loadingSlips, setLoadingSlips] = useState(false);
const [boatDimensions, setBoatDimensions] = useState<{
  loa: number | null;
  beam: number | null;
  draft: number | null;
} | null>(null);
```

**Filter Logic:**
```typescript
const fittingSlips = availableSlips.filter(slip => {
  if (!slip.is_available || slip.current_boat_id) return false;
  
  const loa = boatDimensions?.loa || selectedReservation?.boat?.length_ft || 0;
  const beam = boatDimensions?.beam || 0;
  const draft = boatDimensions?.draft || 0;
  
  // Check each dimension if the slip has a max specified
  if (slip.max_loa_ft && loa > slip.max_loa_ft) return false;
  if (slip.max_beam_ft && beam > 0 && beam > slip.max_beam_ft) return false;
  if (slip.max_draft_ft && draft > 0 && draft > slip.max_draft_ft) return false;
  
  return true;
});
```

---

### UI Changes

**Before (current):**
```
Assign Slip Number
+--------------------------------+
| e.g., A-15                    |
+--------------------------------+
```

**After (new dropdown):**
```
Assign Slip Number
+--------------------------------+
| Select a slip...           v  |
+--------------------------------+
  | D20 - Max: 60ft x 18ft       |
  | D21 - Max: 50ft x 16ft       |
  | (Dock A) A-01 - Max: 45ft    |
+--------------------------------+
```

Each dropdown item will show:
- Slip name (e.g., "D20")
- Dock section if available (e.g., "Dock A")
- Maximum dimensions (e.g., "Max: 60ft LOA, 18ft beam")

---

### Edge Cases Handled

1. **No suitable slips available:** Show a warning message and allow manual text entry as fallback
2. **Missing boat specs:** Use `boats.length_ft` as fallback for LOA, skip beam/draft checks if not available
3. **Missing slip dimensions:** If a slip has no max dimensions set, include it as available (no size restriction)

---

### Files to Modify
1. `src/components/marina/ReservationManager.tsx` - Main changes to the approve dialog

