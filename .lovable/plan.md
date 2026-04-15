
## Plan: Simplify Price Change Approval Section Condition

### Changes to `src/pages/Dashboard.tsx`

**Line 658**: Simplify the condition to only check status:
```typescript
{selectedJobDetail.status === "pending_approval" && (
```

**Lines 666-669**: Update the proposed price display to handle null/0 values:
```typescript
<div className="flex justify-between">
  <span className="text-sm text-muted-foreground">Proposed New Price</span>
  {selectedJobDetail.proposed_retail_price && selectedJobDetail.proposed_retail_price > 0 ? (
    <span className="font-semibold text-amber-700">${selectedJobDetail.proposed_retail_price.toFixed(2)}</span>
  ) : (
    <span className="font-semibold text-amber-700">Proposed price not available</span>
  )}
</div>
```

**Approve button handler (line 677)**: Add guard to prevent approving if no valid price:
```typescript
const proposedPrice = selectedJobDetail.proposed_retail_price;
if (!proposedPrice || proposedPrice <= 0) {
  toast({ title: "Error", description: "No valid proposed price to approve", variant: "destructive" });
  setApprovingPrice(false);
  return;
}
```

This ensures the Approve/Decline buttons always appear when status is `pending_approval`, while gracefully handling missing proposed price data.
