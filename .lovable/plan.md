

## Plan: Auto-populate quantity from boat length for per-foot line items

This is an addendum to the pending QuickQuoteDialog rewrite plan. When building line items from `business_service_menu`, any item with `pricing_model = "per_foot"` should have its `quantity` initialized to `wish.boat.length_ft` (if available), defaulting to 1 otherwise. The quantity field remains editable.

### Changes (within the QuickQuoteDialog rewrite)

**`src/components/provider/LeadStream.tsx` — QuickQuoteDialog line-item initialization**

When fetching menu items and mapping them to line items on dialog open:

```typescript
const boatLength = wish?.boat?.length_ft ?? 1;

const items = (menuData || []).map(item => ({
  name: item.name,
  pricingModel: item.pricing_model,
  quantity: item.pricing_model === "per_foot" ? boatLength : 1,
  unitPrice: item.default_price ?? 0,
  lineTotal: (item.default_price ?? 0) * (item.pricing_model === "per_foot" ? boatLength : 1),
  included: false,
}));
```

- Per-foot items get `quantity = boat.length_ft`, making the line total `price × length`
- All other pricing models default to `quantity = 1`
- The quantity input remains a standard editable number field — provider can override

No additional file or schema changes needed beyond the existing rewrite plan.

