

## Plan: Parts Tracking Per Line Item in ServiceWorkOrders

### 1. `src/components/service/ServiceWorkOrders.tsx`

**New imports & hooks:**
- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `ChevronDown`
- Import `useStoreInventory` from hooks
- Access `enabledModules` from `useBusiness()`
- Add state: `partsByLineItem: Record<string, any[]>`, `addingPartForLineItem: string | null`, `partForm: { itemId: string, quantity: string, chargePrice: string }`

**New function `fetchPartsForWorkOrder(workOrderId)`:**
- Query `parts_pull_log` where `work_order_id = workOrderId`, join with `store_inventory` to get item name
- Group results by `line_item_id` into `partsByLineItem` state

**Call `fetchPartsForWorkOrder`** in the `useEffect` that fires on `selectedWorkOrder` change (line 101-107).

**Line items section (lines 789-807):**
Replace flat line item rows with collapsible rows. For each line item, if `enabledModules.includes("store")`:
- Collapsible trigger showing parts count badge
- Content: list of parts (name, qty, `charge_price × qty`), subtotal
- "Add Part" button toggling inline form with:
  - Select of `inventory` items (active, qty > 0) showing name + stock count
  - Quantity input (number)
  - Charge price input (pre-filled with selected item's `retail_price`, editable)
  - Submit: calls `pullPartForWorkOrder(workOrderId, itemId, qty, null, chargePrice)` → returns record ID → updates that record's `line_item_id` via direct supabase update → refreshes parts data

**Invoice generation (lines 146-210):**
After fetching `woLineItems`, also fetch `parts_pull_log` for the work order. For each parts pull record, add an additional entry to `invoiceLines` with:
- `service_name`: item name (from joined inventory or stored description)
- `quantity`: pull quantity
- `unit_price`: charge_price
- `total`: charge_price × quantity

Add parts totals to `totalAmount` for the invoice.

### Files changed
- `src/components/service/ServiceWorkOrders.tsx`

