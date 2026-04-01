

## Plan: Simplify WishStatusCard and Dashboard wish fetching

### Changes

**1. `src/components/wish/WishStatusCard.tsx`**
- Remove `getEffectiveStatus` function entirely
- Remove `work_order_status` from the `Wish` interface
- Remove unused imports: `Wrench`, `MessageSquare`
- Add `XCircle` import from lucide-react
- Replace `statusConfig` with three entries only:
  - `open` → label "Seeking Quotes", icon `Clock`, variant `"secondary"`
  - `accepted` → label "Quote Accepted", icon `CheckCircle2`, variant `"default"`
  - `closed` → label "Closed", icon `XCircle`, variant `"destructive"`
- Use `wish.status` directly instead of `getEffectiveStatus(wish)` for badge lookup

**2. `src/pages/Dashboard.tsx`**
- Remove `work_order_status` from the `Wish` interface
- Simplify `fetchWishes`: remove the entire work order status lookup block (lines 122-147) — just set wishes directly from `wishData`, no secondary query to `work_orders`

