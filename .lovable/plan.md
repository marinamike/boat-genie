
## Smart Slip Billing & Utility Meter System

### Completed Features

#### 1. Database Schema
Tables created:
- `stay_meter_readings` - Track meter readings tied to check-in/check-out
- `stay_invoices` - Invoice records with stay and utility billing
- `recurring_invoices` - Monthly/Seasonal/Annual recurring billing for long-term tenants
- `mid_stay_meter_readings` - Mid-month meter readings for long-term contracts

#### 2. Rate Calculator (`src/lib/stayBilling.ts`)
Cascading "Best Rate" logic:
- **30+ days**: Monthly rate (divided by 30 for daily equivalent)
- **7-29 days**: Weekly rate (divided by 7 for daily equivalent)
- **1-6 days**: Daily rate

Rate calculation: `Rate Per Day × Duration Days × Vessel Length`

#### 3. Transient Billing Hook (`src/hooks/useStayBilling.ts`)
Functions:
- `recordMeterReading()` - Save meter readings
- `getMeterReadings()` - Fetch readings for a dock status
- `createInvoice()` - Generate finalized invoice
- `getInvoices()` - List all business invoices

#### 4. Recurring Billing Hook (`src/hooks/useRecurringBilling.ts`)
Functions:
- `generateMonthlyInvoice()` - Create monthly invoice for lease
- `recordMidStayReading()` - Record mid-month meter readings
- `getLeaseInvoices()` - Get invoices for a specific lease
- `getBusinessInvoices()` - Get all recurring invoices
- `getMidStayReadings()` - Get mid-stay readings for lease
- `updateInvoiceStatus()` - Mark invoice as paid/sent/void

#### 5. Checkout Billing Sheet (`src/components/slips/CheckoutBillingSheet.tsx`)
"Finalize Billing" modal includes:
- Vessel info and slip assignment
- Stay duration with calculated rate tier
- Meter reading inputs (start locked, end editable)
- Real-time utility usage calculations
- Grand total with breakdown

#### 6. Mid-Month Meter Reading Sheet (`src/components/slips/MidMonthMeterReadingSheet.tsx`)
For long-term tenants:
- Record mid-stay power and water readings
- Auto-calculates usage based on previous reading
- Readings linked to billing period and added to next invoice

#### 7. Recurring Invoice Manager (`src/components/slips/RecurringInvoiceManager.tsx`)
For annual/seasonal contracts:
- Generate monthly invoices on demand
- View invoice history with status badges
- Mark invoices as paid/sent/void
- Displays base rent + utility charges

### Integration Points
- `LiveDockList.tsx` - Check Out button opens billing sheet
- `ReservationManager.tsx` - Check Out action opens billing sheet
- `LeaseManager.tsx` - "Meter Read" and "Invoices" buttons for each lease

### Files Created
1. `src/lib/stayBilling.ts`
2. `src/hooks/useStayBilling.ts`
3. `src/hooks/useRecurringBilling.ts`
4. `src/components/slips/CheckoutBillingSheet.tsx`
5. `src/components/slips/MidMonthMeterReadingSheet.tsx`
6. `src/components/slips/RecurringInvoiceManager.tsx`

### Files Modified
1. `src/components/marina/LiveDockList.tsx`
2. `src/components/marina/ReservationManager.tsx`
3. `src/components/slips/LeaseManager.tsx`
4. `src/pages/SlipsDashboard.tsx`

### Future Enhancements
- Automated recurring invoice generation (cron job on 1st of month)
- Invoice email/PDF export
- Payment integration with Stripe
- Overdue invoice alerts
