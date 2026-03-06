

# Add to Cart from Inventory + Payment Confirmation Flow

## Problem
The Register tab already supports clicking items to add to cart, but inventory items on the Inventory tab lack an "Add to Cart" action. Additionally, the checkout process completes instantly without a payment confirmation step.

## Changes

### 1. Add "Add to Cart" button on Inventory tab (`InventoryManager.tsx`)
- Add a `ShoppingCart` icon button in the Actions column for each item
- Accept an `onAddToCart` callback prop
- When clicked, call the callback with the item

### 2. Wire cart state up to `StoreDashboard.tsx`
- Lift the `cart` state from `POSRegister` up to `StoreDashboard` so both the Inventory tab and Register tab share the same cart
- Pass `cart`, `setCart`, and `addToCart` as props to both `POSRegister` and `InventoryManager`
- When an item is added from Inventory, auto-switch to the Register tab so the user can see the cart and checkout

### 3. Add Payment Confirmation Dialog
- After clicking "Complete Sale", show a payment modal (similar to the existing `PaymentModal` component pattern) with:
  - Order summary (items, quantities, totals)
  - Simulated card input fields (card number, expiry, CVV) for card payments
  - A "Process Payment" button with a 1.5s simulated processing delay
  - Success confirmation dialog after payment completes
- This mirrors the existing simulated payment flow used in the billing module

### Files to modify
- `src/pages/StoreDashboard.tsx` -- lift cart state, manage active tab, pass props
- `src/components/store/POSRegister.tsx` -- accept cart as props instead of internal state
- `src/components/store/InventoryManager.tsx` -- add "Add to Cart" button column

