

# Enhanced Unified Customer Billing Portal

## Overview

This plan updates the existing billing portal with a proper simulated payment flow including a card entry modal, transaction record tracking, and payment confirmation.

## Current State Analysis

The existing implementation includes:
- `customer_invoices` table with proper RLS policies
- `useCustomerInvoices` hook for fetching and managing invoices
- `CustomerBillingTab` component displaying pending/paid invoices
- `InvoiceDetailSheet` with source-specific line item display
- Database trigger `notify_new_invoice()` for automatic notifications
- Real-time subscriptions for invoice updates

**What's Missing:**
1. Payment modal with simulated card entry (currently just marks as paid directly)
2. Transaction record storage for payment history
3. "Payment Successful" confirmation dialog

## Implementation Plan

### 1. Database: Payment Transactions Table

Create a new table to store payment transaction records:

```text
+---------------------------+
|   payment_transactions    |
+---------------------------+
| id (PK)                   |
| customer_invoice_id (FK)  |
| customer_id              |
| amount                    |
| payment_method           |
| card_last_four           |
| status                    |
| processed_at             |
| created_at               |
+---------------------------+
```

- Links to `customer_invoices` via foreign key
- Stores simulated card details (last 4 digits only)
- Tracks payment status and timestamp

### 2. New Component: PaymentModal

Create `src/components/billing/PaymentModal.tsx`:

**Features:**
- Step 1: Review invoice amount
- Step 2: Simulated card entry form (card number, expiry, CVV)
- Step 3: Processing state with spinner
- Step 4: Success confirmation

**Card Input Fields:**
- Card Number (16 digits, auto-format with spaces)
- Expiry (MM/YY format)
- CVV (3-4 digits)
- Name on Card

**Validation:**
- Card number: 16 digits (simulated Luhn check optional)
- Expiry: Valid MM/YY format, not expired
- CVV: 3-4 digits

### 3. Update: useCustomerInvoices Hook

Add new function `processPayment()`:

```text
processPayment(invoiceId, cardDetails) → Promise<boolean>
  1. Validate card details (basic format validation)
  2. Create payment_transaction record with status 'processing'
  3. Simulate processing delay (1-2 seconds)
  4. Update payment_transaction to 'completed'
  5. Update customer_invoice status to 'paid'
  6. Update source invoice (stay_invoices, recurring_invoices, etc.)
  7. Return success/failure
```

### 4. Update: CustomerBillingTab

- Replace direct `markAsPaid` call with `PaymentModal` open
- Add state for selected invoice and modal visibility
- Pass payment handler to modal

### 5. Update: InvoiceDetailSheet

- Replace direct payment action with opening `PaymentModal`
- Add success callback to close detail sheet after payment

### 6. New Component: PaymentSuccessDialog

Create `src/components/billing/PaymentSuccessDialog.tsx`:

Displays after successful payment:
- Green checkmark animation
- "Payment Successful" title
- Amount paid
- Transaction reference
- "View Receipt" and "Done" buttons

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/...` | Create | Add payment_transactions table with RLS |
| `src/components/billing/PaymentModal.tsx` | Create | Card entry form with validation |
| `src/components/billing/PaymentSuccessDialog.tsx` | Create | Success confirmation dialog |
| `src/hooks/useCustomerInvoices.ts` | Update | Add processPayment function |
| `src/components/billing/CustomerBillingTab.tsx` | Update | Integrate PaymentModal |
| `src/components/billing/InvoiceDetailSheet.tsx` | Update | Integrate PaymentModal |

## Technical Details

### Database Migration

```sql
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id),
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  card_last_four TEXT,
  card_brand TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Customers can view their own transactions
CREATE POLICY "Customers can view own transactions"
ON public.payment_transactions
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

-- Customers can insert transactions for their invoices
CREATE POLICY "Customers can create transactions"
ON public.payment_transactions
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());
```

### PaymentModal Component Structure

```text
PaymentModal
├── Header: "Complete Payment"
├── Invoice Summary
│   ├── Business Name
│   ├── Description
│   └── Total Amount (highlighted)
├── Card Form
│   ├── Card Number Input (with format mask)
│   ├── Expiry / CVV Row
│   └── Name on Card
├── Submit Button
└── Cancel Link
```

### Card Number Formatting

- Display: `1234 5678 9012 3456`
- Store: Last 4 digits only (`3456`)
- Brand detection: First digit (4=Visa, 5=MC, 3=Amex)

### Payment Flow Sequence

```text
User clicks "Pay Now"
    ↓
PaymentModal opens
    ↓
User enters card details
    ↓
User clicks "Pay $X.XX"
    ↓
[Processing State - 1.5s delay]
    ↓
Insert payment_transaction
    ↓
Update customer_invoice.status = 'paid'
    ↓
Update source table status
    ↓
PaymentSuccessDialog shows
    ↓
User clicks "Done"
    ↓
Return to invoice list (refreshed)
```

### Notification System (Already Implemented)

The existing `notify_new_invoice()` trigger already creates notifications when invoices are inserted:

```text
Notification format:
- Title: "New Invoice Available"
- Message: "You have a new invoice for [source_reference] totaling $[amount]"
- Type: "invoice"
- Related ID: invoice UUID
```

No changes needed - notifications are automatically triggered.

## UI/UX Considerations

1. **Card Form Accessibility**: Proper labels, tab order, input patterns
2. **Error States**: Clear validation messages for invalid card details
3. **Loading States**: Disable form during processing, show spinner
4. **Mobile-Friendly**: Full-width inputs, large touch targets
5. **Security Messaging**: "Secure payment" text reassures users

## Testing Scenarios

1. Open payment modal from invoice list "Pay Now" button
2. Open payment modal from invoice detail sheet
3. Submit with valid card details → Success
4. Submit with invalid card format → Validation error
5. Verify transaction record created in database
6. Verify invoice status updates to "paid"
7. Verify invoice moves from "Pending" to "Payment History" section
8. Verify success dialog appears with correct amount

