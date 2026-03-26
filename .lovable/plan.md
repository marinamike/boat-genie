

## Plan: Add Services Section to Work Order Detail Panel

### Overview
Add a "Services" section showing line items on a work order, with ability to add services from the business service menu. When services are added, handle re-approval logic based on work order status.

### Step 1: Create `work_order_line_items` Table
Database migration to create the table:
- `id` (uuid, PK, default gen_random_uuid())
- `work_order_id` (uuid, FK to work_orders.id, ON DELETE CASCADE, NOT NULL)
- `service_name` (text, NOT NULL)
- `unit_price` (numeric, NOT NULL, default 0)
- `quantity` (integer, NOT NULL, default 1)
- `total` (numeric, NOT NULL, default 0)
- `created_at` (timestamptz, default now())

Enable RLS with policies allowing authenticated users who own the business or are staff to read/write line items (using `get_user_business_id()` joined through work_orders).

### Step 2: Update `ServiceWorkOrders.tsx`
Add a new "Services" card section between the Customer Info card and the Time Clock card:

**Display**: List all line items for the selected work order (service name, qty, unit price, line total). Show a subtotal at the bottom.

**"Add Service" button**: Opens a Sheet with:
- A Select dropdown populated from `useServiceMenu().activeMenuItems`
- Pre-fills unit price from the selected menu item's `default_price`
- Quantity input (default 1)
- Computed total (unit_price * quantity)
- Save button

**On save logic**:
1. Insert the line item into `work_order_line_items`
2. Recalculate total from all line items and update `work_orders.retail_price`
3. **If status is `pending` or `pending_approval`**: Update status to `pending_approval`, clear `approved_at`, and resend the approval email via `send-owner-invite` edge function (reuse the pattern from `EditWorkOrderSheet`)
4. **If status is `approved` or later** (`assigned`, `in_progress`, etc.): Show a confirmation dialog "This will require customer re-approval. Continue?" before proceeding. If confirmed, set status back to `pending_approval`, clear `approved_at`, and resend approval email.

**State management**: 
- New state: `lineItems`, `showAddServiceSheet`, `addServiceForm` (selected menu item, quantity)
- New function: `fetchLineItems(workOrderId)` — queries `work_order_line_items` for the selected work order
- New function: `handleAddService()` — inserts line item, updates work order price/status, conditionally resends email
- Import and use `useServiceMenu` hook for the service menu dropdown

### Technical Details

**New imports needed**: `useServiceMenu` hook, `AlertDialog` components for the re-approval confirmation.

**Approval email resend**: Reuse the same pattern as `EditWorkOrderSheet.handleSaveAndResend()` — fetch `approval_token`, `business_id`, build recipient info from the work order's guest/owner data, invoke `send-owner-invite`.

**Files modified**:
- `src/components/service/ServiceWorkOrders.tsx` — add Services section UI, line item CRUD, re-approval logic
- Database migration — create `work_order_line_items` table with RLS

