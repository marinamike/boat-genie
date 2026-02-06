
## Cascading Rate Engine & Utility Billing

### Completed Features

#### 1. Database Schema
New tables created:
- `stay_meter_readings` - Track meter readings tied to check-in/check-out
- `stay_invoices` - Invoice records with stay and utility billing

#### 2. Rate Calculator (`src/lib/stayBilling.ts`)
Cascading rate logic:
- **30+ days**: Monthly rate (divided by 30 for daily equivalent)
- **7-29 days**: Weekly rate (divided by 7 for daily equivalent)
- **1-6 days**: Daily rate

Rate calculation: `Rate Per Day × Duration Days × Vessel Length`

#### 3. Billing Hook (`src/hooks/useStayBilling.ts`)
Functions:
- `recordMeterReading()` - Save meter readings
- `getMeterReadings()` - Fetch readings for a dock status
- `createInvoice()` - Generate finalized invoice
- `getInvoices()` - List all business invoices

#### 4. Checkout Billing Sheet (`src/components/slips/CheckoutBillingSheet.tsx`)
Modal includes:
- Vessel info and slip assignment
- Stay duration with calculated rate tier
- Meter reading inputs (start locked, end editable)
- Real-time utility usage calculations
- Grand total with breakdown

#### 5. Integration Points
- `LiveDockList.tsx` - Check Out button opens billing sheet
- `ReservationManager.tsx` - Check Out action opens billing sheet

### Files Created
1. `src/lib/stayBilling.ts`
2. `src/hooks/useStayBilling.ts`
3. `src/components/slips/CheckoutBillingSheet.tsx`

### Files Modified
1. `src/components/marina/LiveDockList.tsx`
2. `src/components/marina/ReservationManager.tsx`

### Future Enhancements
- Long-term recurring invoices (annual/seasonal)
- Mid-stay meter reading workflow
- Invoice export/print functionality
- Payment integration
