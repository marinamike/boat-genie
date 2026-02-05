
# Fix: Quick-Log Fuel Sale Window Not Fully Visible

## Problem
When using the Quick-Log Fuel Sale form, the content extends beyond the visible area (especially on smaller screens or when the "Total Amount" section appears after entering gallons). The "Record Sale" button gets cut off and users cannot complete the transaction.

## Root Cause
The `SheetContent` component in `QuickSaleForm.tsx` lacks scrolling capability. When the form content grows (with the Total Amount display appearing), it overflows the fixed-height sheet without providing a way to scroll.

## Solution
Add scrolling support to the Sheet content so all form fields and the submit button remain accessible regardless of screen size.

## Changes Required

### 1. Update QuickSaleForm.tsx

Add `overflow-y-auto` to the `SheetContent` to enable vertical scrolling, and wrap the form in a flex container to ensure proper layout:

**Current:**
```tsx
<SheetContent className="sm:max-w-md">
```

**Updated:**
```tsx
<SheetContent className="sm:max-w-md overflow-y-auto">
```

Also add bottom padding to the form to ensure the button isn't cut off at the edge:

**Current:**
```tsx
<form onSubmit={handleSubmit} className="space-y-4 mt-6">
```

**Updated:**
```tsx
<form onSubmit={handleSubmit} className="space-y-4 mt-6 pb-6">
```

## Files to Modify
- `src/components/fuel/QuickSaleForm.tsx`

## Testing
1. Navigate to `/business/fuel`
2. Click "Record Sale" to open the Quick-Log Fuel Sale sheet
3. Select a pump and enter gallons to trigger the Total Amount display
4. Verify the entire form is scrollable and the "Record Sale" button is visible and clickable
5. Test on mobile viewport to confirm scrolling works on smaller screens
