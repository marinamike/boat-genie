ALTER TABLE public.parts_pull_log
  ADD COLUMN line_item_id uuid REFERENCES public.work_order_line_items(id) ON DELETE SET NULL,
  ADD COLUMN charge_price numeric NOT NULL DEFAULT 0;