

## Plan: Alter parts_pull_log table — add line_item_id and charge_price columns

### Migration SQL

```sql
ALTER TABLE public.parts_pull_log
  ADD COLUMN line_item_id uuid REFERENCES public.work_order_line_items(id) ON DELETE SET NULL,
  ADD COLUMN charge_price numeric NOT NULL DEFAULT 0;
```

### Code updates

#### `src/hooks/useStoreInventory.ts`
Update the `PartsPullLog` interface to include the new fields:
- `line_item_id: string | null`
- `charge_price: number`

Update the `pullPartForWorkOrder` function to accept an optional `chargePrice` parameter and include `charge_price` in the insert payload (defaulting to `item.retail_price` or the provided value).

### Files changed
- Database migration (new)
- `src/hooks/useStoreInventory.ts` (modified)

