

## Plan: Create invoices & invoice_line_items tables + add "disputed" to work_order_status

### Database Migration

Single migration with three parts:

**1. Add "disputed" to work_order_status enum**
```sql
ALTER TYPE public.work_order_status ADD VALUE 'disputed';
```

**2. Create `invoices` table**
- `id` uuid PK default `gen_random_uuid()`
- `work_order_id` uuid FK → work_orders(id) NOT NULL
- `business_id` uuid FK → businesses(id) NOT NULL
- `boat_id` uuid FK → boats(id) NOT NULL
- `owner_id` uuid nullable FK → profiles(id)
- `guest_customer_id` uuid nullable FK → guest_customers(id)
- `status` text default `'pending_review'` NOT NULL
- `total_amount` numeric NOT NULL default 0
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- Add `updated_at` trigger using existing `update_updated_at_column()` function
- Enable RLS with policies for business owner/staff (full CRUD) and boat owner (select + update for approve/dispute)

**3. Create `invoice_line_items` table**
- `id` uuid PK default `gen_random_uuid()`
- `invoice_id` uuid FK → invoices(id) ON DELETE CASCADE NOT NULL
- `service_name` text NOT NULL
- `quantity` numeric NOT NULL default 1
- `unit_price` numeric NOT NULL default 0
- `total` numeric NOT NULL default 0
- `verified` boolean default false
- `disputed` boolean default false
- `dispute_note` text nullable
- `created_at` timestamptz default now()
- Enable RLS with policies mirroring the invoices table (join through invoice_id)

### RLS Policies

**invoices:**
- Business owner or staff can SELECT, INSERT, UPDATE, DELETE where `is_business_owner(business_id) OR is_business_staff(business_id)`
- Boat owner can SELECT and UPDATE (for approving/disputing) where `owner_id = auth.uid()`

**invoice_line_items:**
- Business owner/staff: full access via join to invoices on business_id
- Boat owner: SELECT + UPDATE (for disputing individual lines) via join to invoices on owner_id

### Files changed
- Database migration only (no code changes needed yet)

