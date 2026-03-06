DROP POLICY "Staff can create receipt items" ON public.sales_receipt_items;

CREATE POLICY "Staff and owners can create receipt items" ON public.sales_receipt_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sales_receipts sr
    WHERE sr.id = sales_receipt_items.receipt_id
      AND (
        is_business_owner(sr.business_id)
        OR has_module_permission(sr.business_id, 'store', 'write')
      )
  )
);