

## Plan: Price Change Approval UI in Job Detail Sheet

### 1. `src/pages/Dashboard.tsx` — ActiveJob interface & fetchActiveJobs

Add `retail_price`, `proposed_retail_price`, and `business_id` to the `ActiveJob` interface and the `fetchActiveJobs` select query (line 155):

```typescript
interface ActiveJob {
  // ...existing fields...
  retail_price: number | null;
  proposed_retail_price: number | null;
  business_id: string | null;
}
```

Select becomes:
```
"id, title, status, scheduled_date, created_at, description, retail_price, proposed_retail_price, business_id, boat:boats(name), business:businesses!work_orders_business_id_fkey(business_name)"
```

### 2. `src/pages/Dashboard.tsx` — Price Change Approval section in job detail sheet

Inside the job detail sheet (after the description block, line ~651), add a conditional block when `selectedJobDetail.status === "pending_approval"`:

- Display "Price Change Pending Approval" header
- Show original price (`retail_price`) and proposed price (`proposed_retail_price`)
- Two buttons: "Approve New Price" and "Decline Change"
- Add state `approvingPrice` for loading

**Approve handler**:
- Update work order: `retail_price = proposed_retail_price`, `wholesale_price = proposed_retail_price`, `proposed_retail_price = null`, `status = "assigned"`
- Fetch business owner_id from `businesses` table using `selectedJobDetail.business_id`
- Insert notification to business owner: title "Price Change Approved", message "[owner name] approved the updated price for [title]"
- Close sheet, refresh `fetchActiveJobs`

**Decline handler**:
- Update work order: `proposed_retail_price = null`, `status = "assigned"`
- Fetch business owner_id, insert notification: title "Price Change Declined", message "[owner name] declined the price change for [title]. Original price stands."
- Close sheet, refresh `fetchActiveJobs`

### Files changed
- `src/pages/Dashboard.tsx` — interface update, query update, approval UI + handlers

