-- Create item category enum
CREATE TYPE public.store_item_category AS ENUM ('parts', 'retail', 'consumables');

-- Create store inventory table
CREATE TABLE public.store_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category store_item_category NOT NULL DEFAULT 'retail',
  description TEXT,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_part BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on SKU per business
CREATE UNIQUE INDEX idx_store_inventory_sku ON public.store_inventory(business_id, sku) WHERE sku IS NOT NULL;

-- Create unique constraint on barcode per business
CREATE UNIQUE INDEX idx_store_inventory_barcode ON public.store_inventory(business_id, barcode) WHERE barcode IS NOT NULL;

-- Enable RLS
ALTER TABLE public.store_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_inventory
CREATE POLICY "Business owners can manage inventory"
ON public.store_inventory
FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Business staff can view inventory"
ON public.store_inventory
FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Staff with store write permission can manage inventory"
ON public.store_inventory
FOR ALL
USING (has_module_permission(business_id, 'store', 'write'));

-- Create sales receipts table
CREATE TABLE public.sales_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  boat_id UUID REFERENCES public.boats(id),
  boat_name TEXT,
  is_guest_checkout BOOLEAN NOT NULL DEFAULT false,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'card',
  notes TEXT,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on receipt number per business
CREATE UNIQUE INDEX idx_sales_receipts_number ON public.sales_receipts(business_id, receipt_number);

-- Enable RLS
ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_receipts
CREATE POLICY "Business owners can manage receipts"
ON public.sales_receipts
FOR ALL
USING (is_business_owner(business_id));

CREATE POLICY "Business staff can view receipts"
ON public.sales_receipts
FOR SELECT
USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Staff with store write permission can create receipts"
ON public.sales_receipts
FOR INSERT
WITH CHECK (has_module_permission(business_id, 'store', 'write'));

CREATE POLICY "Customers can view their own receipts"
ON public.sales_receipts
FOR SELECT
USING (customer_id = auth.uid());

-- Create receipt line items table
CREATE TABLE public.sales_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.sales_receipts(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'inventory', -- 'inventory', 'fuel', 'service'
  inventory_item_id UUID REFERENCES public.store_inventory(id),
  fuel_transaction_id UUID REFERENCES public.fuel_transactions(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,3) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_receipt_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receipt items (inherit from parent receipt)
CREATE POLICY "Users can view receipt items for accessible receipts"
ON public.sales_receipt_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.sales_receipts sr
  WHERE sr.id = receipt_id
  AND (is_business_owner(sr.business_id) OR is_business_staff(sr.business_id) OR sr.customer_id = auth.uid())
));

CREATE POLICY "Staff can create receipt items"
ON public.sales_receipt_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales_receipts sr
  WHERE sr.id = receipt_id
  AND has_module_permission(sr.business_id, 'store', 'write')
));

-- Create parts pull log for tracking parts added to work orders
CREATE TABLE public.parts_pull_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.store_inventory(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  pulled_by UUID NOT NULL,
  pulled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parts_pull_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parts pull log
CREATE POLICY "Business staff can view parts pull logs"
ON public.parts_pull_log
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.work_orders wo
  JOIN public.businesses b ON b.id = wo.business_id
  WHERE wo.id = work_order_id
  AND (is_business_owner(b.id) OR is_business_staff(b.id))
));

CREATE POLICY "Staff can create parts pull logs"
ON public.parts_pull_log
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.work_orders wo
  WHERE wo.id = work_order_id
  AND has_module_permission(wo.business_id, 'store', 'write')
));

-- Add 'store' to the business_module enum
ALTER TYPE public.business_module ADD VALUE IF NOT EXISTS 'store';

-- Add updated_at trigger for store_inventory
CREATE TRIGGER update_store_inventory_updated_at
BEFORE UPDATE ON public.store_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();