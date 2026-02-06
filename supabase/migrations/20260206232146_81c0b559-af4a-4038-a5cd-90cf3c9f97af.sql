-- Create enum for invoice source types
CREATE TYPE public.invoice_source AS ENUM (
  'service',
  'slip_transient', 
  'slip_lease',
  'fuel',
  'store'
);

-- Create unified customer invoices table
CREATE TABLE public.customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Source identification
  source_type public.invoice_source NOT NULL,
  source_id UUID NOT NULL,
  source_reference TEXT, -- e.g., "Work Order #101", "Monthly Rent - March 2025"
  
  -- Core invoice data
  invoice_number TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  
  -- Metadata
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

-- Customers can view their own invoices
CREATE POLICY "Customers can view own invoices"
ON public.customer_invoices
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Customers can update their own invoices (for payment)
CREATE POLICY "Customers can update own invoices"
ON public.customer_invoices
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid());

-- Business owners/staff can manage invoices for their business
CREATE POLICY "Business can manage invoices"
ON public.customer_invoices
FOR ALL
TO authenticated
USING (
  public.is_business_owner(business_id) OR 
  public.is_business_staff(business_id)
);

-- Platform admin can view all
CREATE POLICY "Platform admin can view all invoices"
ON public.customer_invoices
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

-- Create indexes for performance
CREATE INDEX idx_customer_invoices_customer ON public.customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_business ON public.customer_invoices(business_id);
CREATE INDEX idx_customer_invoices_status ON public.customer_invoices(status);
CREATE INDEX idx_customer_invoices_source ON public.customer_invoices(source_type, source_id);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_invoices_updated_at
BEFORE UPDATE ON public.customer_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create notification when invoice is created
CREATE OR REPLACE FUNCTION public.notify_new_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    NEW.customer_id,
    'New Invoice Available',
    'You have a new invoice for ' || COALESCE(NEW.source_reference, 'services') || ' totaling $' || NEW.amount::TEXT,
    'invoice',
    NEW.id::TEXT
  );
  RETURN NEW;
END;
$$;

-- Trigger to notify on new invoice
CREATE TRIGGER trigger_notify_new_invoice
AFTER INSERT ON public.customer_invoices
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_invoice();

-- Add owner_id to stay_invoices for customer lookup (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stay_invoices' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.stay_invoices ADD COLUMN owner_id UUID;
  END IF;
END $$;

-- Enable realtime for customer_invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_invoices;