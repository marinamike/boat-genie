
-- 1. Add "disputed" to work_order_status enum
ALTER TYPE public.work_order_status ADD VALUE 'disputed';

-- 2. Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  boat_id UUID NOT NULL REFERENCES public.boats(id),
  owner_id UUID REFERENCES public.profiles(id),
  guest_customer_id UUID REFERENCES public.guest_customers(id),
  status TEXT NOT NULL DEFAULT 'pending_review',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Business owner/staff: full CRUD
CREATE POLICY "Business can manage invoices"
  ON public.invoices FOR ALL
  USING (public.is_business_owner(business_id) OR public.is_business_staff(business_id))
  WITH CHECK (public.is_business_owner(business_id) OR public.is_business_staff(business_id));

-- Boat owner: can view their invoices
CREATE POLICY "Owner can view invoices"
  ON public.invoices FOR SELECT
  USING (owner_id = auth.uid());

-- Boat owner: can update (approve/dispute) their invoices
CREATE POLICY "Owner can update invoices"
  ON public.invoices FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  disputed BOOLEAN NOT NULL DEFAULT false,
  dispute_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Business owner/staff: full CRUD on line items
CREATE POLICY "Business can manage line items"
  ON public.invoice_line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
    AND (public.is_business_owner(i.business_id) OR public.is_business_staff(i.business_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
    AND (public.is_business_owner(i.business_id) OR public.is_business_staff(i.business_id))
  ));

-- Boat owner: can view line items
CREATE POLICY "Owner can view line items"
  ON public.invoice_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id AND i.owner_id = auth.uid()
  ));

-- Boat owner: can update line items (dispute)
CREATE POLICY "Owner can update line items"
  ON public.invoice_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id AND i.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id AND i.owner_id = auth.uid()
  ));
