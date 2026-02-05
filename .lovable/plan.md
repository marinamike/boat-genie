
# Simplify Fuel Delivery Request Form

## Overview
Streamline the delivery request form to only capture essential information upfront, and move all other details to the confirmation step when the fuel actually arrives.

## Current State
The **DeliveryRequestForm** currently has these fields:
- Tank selection (product type) - **Keep**
- Gallons requested - **Keep**
- Vendor name - **Keep**
- PO/Invoice number - Move to confirmation
- Expected cost per gallon - Move to confirmation
- Notes - Move to confirmation

The **ConfirmDeliverySheet** currently has:
- Actual gallons delivered
- Actual cost per gallon
- Notes

## Changes

### 1. Simplify DeliveryRequestForm
Remove the following fields from the request form:
- Invoice number input
- Expected cost per gallon input
- Notes textarea
- Estimated cost display

The form will only show:
- **Product Type** (tank selection dropdown)
- **Gallons Requested** (number input)
- **Vendor Name** (text input)

### 2. Enhance ConfirmDeliverySheet
Add fields that were removed from the request form:
- **PO/Invoice Number** (text input) - for recording the invoice when fuel arrives
- Keep existing: Actual gallons delivered, Cost per gallon, Notes

### 3. Update Hook Function
Modify `createDeliveryRequest` function signature:
- Remove `invoice_number`, `cost_per_gallon`, and `notes` from the request creation parameters
- These will only be set during confirmation

Modify `confirmDelivery` function signature:
- Add `invoice_number` parameter to capture invoice details at confirmation time

---

## Technical Details

### File: `src/components/fuel/DeliveryRequestForm.tsx`
- Remove state variables: `invoiceNumber`, `costPerGallon`, `notes`
- Remove these from form submission payload
- Remove corresponding form field JSX (lines 136-192)
- Simplify interface to only require `tank_id`, `gallons_requested`, `vendor_name`

### File: `src/components/fuel/ConfirmDeliverySheet.tsx`
- Add `invoiceNumber` state variable
- Add Invoice Number input field after the request summary section
- Update `onConfirmDelivery` call to include `invoice_number`
- Pre-fill invoice number from delivery if it exists (for edge cases)

### File: `src/hooks/useFuelManagement.ts`
- Update `createDeliveryRequest` function to only accept: `tank_id`, `gallons_requested`, `vendor_name`
- Update `confirmDelivery` function to accept additional field: `invoice_number`
- Update the database insert/update calls accordingly

