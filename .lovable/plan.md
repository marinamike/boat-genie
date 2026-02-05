
# Plan: Add Edit and Delete for Tanks and Pumps

## Current State
- Edit functionality already exists for both tanks and pumps (pencil button triggers the edit form)
- Delete functionality is missing entirely

## Changes Required

### 1. Add Delete Functions to useFuelManagement Hook
Add two new functions to `src/hooks/useFuelManagement.ts`:
- `deleteTank(id: string)` - Deletes a tank after checking it has no linked pumps
- `deletePump(id: string)` - Deletes a pump from the database

Both functions will show appropriate toast messages and refresh the data after deletion.

### 2. Add Delete Button to Tank Cards
Update `src/components/fuel/TankGauge.tsx`:
- Add an `onDelete` prop
- Add a trash icon button next to the edit button
- Include a confirmation dialog before deletion (using AlertDialog)

### 3. Add Delete Button to Pump Rows
Update `src/pages/FuelDashboard.tsx`:
- Add a trash icon button next to the edit button for pumps
- Include a confirmation dialog before deletion

### 4. Wire Up Delete Handlers in FuelDashboard
Update `src/pages/FuelDashboard.tsx`:
- Import and use the new `deleteTank` and `deletePump` functions from the hook
- Pass delete handlers to child components

## Technical Details

### Delete Tank Function
```typescript
const deleteTank = async (id: string) => {
  // Check if tank has linked pumps
  const linkedPumps = pumps.filter(p => p.tank_id === id);
  if (linkedPumps.length > 0) {
    toast({ 
      title: "Cannot delete tank", 
      description: "Remove linked pumps first",
      variant: "destructive" 
    });
    return false;
  }
  // Delete from database
  // Refresh data
};
```

### Delete Pump Function
```typescript
const deletePump = async (id: string) => {
  // Delete from database
  // Refresh data
};
```

### Confirmation Dialog
Uses the existing AlertDialog component to confirm before destructive actions.

## Files to Modify
1. `src/hooks/useFuelManagement.ts` - Add deleteTank and deletePump functions
2. `src/components/fuel/TankGauge.tsx` - Add delete button with confirmation
3. `src/pages/FuelDashboard.tsx` - Wire up delete handlers and add pump delete UI
