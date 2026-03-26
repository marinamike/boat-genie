
-- Create work_order_line_items table
CREATE TABLE public.work_order_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_order_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Business owner or staff can read line items for their work orders
CREATE POLICY "Business can read own line items"
  ON public.work_order_line_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND wo.business_id = public.get_user_business_id()
    )
  );

-- Policy: Business owner or staff can insert line items for their work orders
CREATE POLICY "Business can insert own line items"
  ON public.work_order_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND wo.business_id = public.get_user_business_id()
    )
  );

-- Policy: Business owner or staff can delete line items for their work orders
CREATE POLICY "Business can delete own line items"
  ON public.work_order_line_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND wo.business_id = public.get_user_business_id()
    )
  );
