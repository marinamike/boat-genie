
# Service Menu and Work Order Creation

## Overview

Add a **Service Menu** management tab to the Business Settings, and a **"New Work Order"** creation dialog to the Service Dashboard. The service menu defines reusable service items (e.g., "Bottom Job", "Oil Change") with flexible pricing models. Work order creation pulls from this menu to auto-fill pricing and descriptions.

## 1. Database: `business_service_menu` Table

A new table to store the business's catalog of service offerings, separate from the provider-level `provider_services` table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| business_id | UUID (FK) | References businesses |
| name | TEXT | Service name |
| category | TEXT | Mechanical, Electrical, Cosmetic, Hull, Rigging, General |
| pricing_model | TEXT | "fixed", "hourly", "per_foot" |
| default_price | NUMERIC | Default rate |
| description | TEXT | Optional description |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

RLS policies will restrict access to authenticated business members.

## 2. Service Menu Tab (Business Settings)

Add a fourth tab **"Service Menu"** to `BusinessSettings.tsx` with a wrench icon.

**New component: `src/components/business/ServiceMenuManager.tsx`**

Features:
- "Create Service Item" button opens an inline form
- Fields: Name, Category (dropdown), Pricing Logic (dropdown), Default Price, Description
- Lists all active services grouped by category
- Each item is editable inline (name, price, category)
- Toggle active/inactive for soft-delete

## 3. New Work Order Dialog

**New component: `src/components/service/CreateServiceWorkOrderDialog.tsx`**

A multi-step dialog triggered by a "New Work Order" button added to the `ServiceWorkOrders` component header.

### Step 1 - Client
- **Search Customer**: Query `boats` table joined with owner profiles to find customers
- **Select Boat**: Dropdown filtered to selected customer's boats
- Shows boat name, make/model, length

### Step 2 - The Job
- **"Add Service Line Item"** button
- Dropdown pulls from `business_service_menu` (active items only)
- Selecting a service auto-fills description and default price
- Price is editable (override allowed)
- Support adding multiple line items
- Running total displayed

### Step 3 - Schedule
- **Start Date** picker (optional)
- **Assigned Technician** dropdown from `service_staff` (optional)

### Submit
- Creates a `work_orders` record with status "pending"
- Stores line items as JSON in the description or a related structure
- Links to business_id, boat_id

## 4. Hook Updates

**New hook: `src/hooks/useServiceMenu.ts`**
- CRUD operations for `business_service_menu`
- Fetches menu items filtered by business_id

**Update: `src/hooks/useServiceManagement.ts`**
- Add `createWorkOrder` function to insert into `work_orders` table with business_id, boat_id, title, description, status, scheduled_date

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | `business_service_menu` table with RLS |
| `src/hooks/useServiceMenu.ts` | Create | CRUD hook for service menu items |
| `src/components/business/ServiceMenuManager.tsx` | Create | Service menu management UI |
| `src/components/service/CreateServiceWorkOrderDialog.tsx` | Create | Multi-step work order creation dialog |
| `src/pages/BusinessSettings.tsx` | Update | Add "Service Menu" tab (4th tab) |
| `src/components/service/ServiceWorkOrders.tsx` | Update | Add "New Work Order" button to header |
| `src/hooks/useServiceManagement.ts` | Update | Add createWorkOrder function |

## Technical Details

### Service Menu RLS Policies

```sql
-- Business members can read their menu
CREATE POLICY "Business members can view service menu"
ON public.business_service_menu FOR SELECT TO authenticated
USING (business_id IN (
  SELECT id FROM businesses WHERE owner_id = auth.uid()
  UNION
  SELECT business_id FROM business_staff WHERE user_id = auth.uid()
));

-- Business owners can manage menu
CREATE POLICY "Business owners can manage service menu"
ON public.business_service_menu FOR ALL TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
```

### Work Order Creation Flow

```text
User clicks "New Work Order"
    |
Step 1: Search/select customer -> Select boat
    |
Step 2: Add line items from Service Menu
    |  -> Auto-fills name, description, price
    |  -> Multiple items supported
    |
Step 3: Set start date, assign tech (optional)
    |
Submit -> INSERT into work_orders
    |  -> status = 'pending'
    |  -> business_id from context
    |
Refresh work order list
```

### Customer Search Query

The dialog will search the `boats` table and join with profile data to let the business find customers by boat name or owner. Since boats have `owner_id`, the dialog groups boats by owner for selection.
