

# Receipt Detail Dialog for Sales History

## Overview
Make each transaction row in the Sales History clickable to open a full receipt view in a dialog/sheet.

## Changes

### 1. New Component: `ReceiptDetailDialog.tsx`
Create a dialog that displays the full receipt, styled like a printed receipt:
- Receipt number, date/time
- Customer name (or "Guest"), boat name if present
- Full itemized list (all items, not truncated)
- Subtotal, tax (rate + amount), total
- Payment method indicator (card/cash)
- Notes if any

### 2. Update `TransactionHistory.tsx`
- Add `cursor-pointer` to each receipt row
- Track `selectedReceipt` state
- On click, open the `ReceiptDetailDialog` with the selected receipt

### Files
- **Create**: `src/components/store/ReceiptDetailDialog.tsx`
- **Edit**: `src/components/store/TransactionHistory.tsx` — add click handler and dialog state

