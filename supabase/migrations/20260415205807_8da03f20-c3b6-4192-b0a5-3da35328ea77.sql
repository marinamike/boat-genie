-- Delete invoice_line_items tied to duplicate (older) invoices
DELETE FROM public.invoice_line_items
WHERE invoice_id IN (
  SELECT id FROM public.invoices i
  WHERE EXISTS (
    SELECT 1 FROM public.invoices i2
    WHERE i2.work_order_id = i.work_order_id
      AND i2.created_at > i.created_at
  )
);

-- Delete the older duplicate invoices themselves
DELETE FROM public.invoices i
WHERE EXISTS (
  SELECT 1 FROM public.invoices i2
  WHERE i2.work_order_id = i.work_order_id
    AND i2.created_at > i.created_at
);