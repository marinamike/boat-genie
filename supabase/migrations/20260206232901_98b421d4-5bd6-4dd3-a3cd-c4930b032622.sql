-- Create payment_transactions table for tracking payment history
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  card_last_four TEXT,
  card_brand TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own transactions
CREATE POLICY "Customers can view own transactions"
ON public.payment_transactions
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

-- Customers can insert transactions for their invoices
CREATE POLICY "Customers can create transactions"
ON public.payment_transactions
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Customers can update their own pending transactions
CREATE POLICY "Customers can update own transactions"
ON public.payment_transactions
FOR UPDATE TO authenticated
USING (customer_id = auth.uid());

-- Business staff can view transactions for their business invoices
CREATE POLICY "Business staff can view transactions"
ON public.payment_transactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customer_invoices ci
    WHERE ci.id = customer_invoice_id
    AND (
      public.is_business_owner(ci.business_id)
      OR public.is_business_staff(ci.business_id)
    )
  )
);