
-- Enable realtime for work_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;

-- Create trigger function to notify business owner on work order approval
CREATE OR REPLACE FUNCTION public.notify_work_order_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_name TEXT;
  v_boat_name TEXT;
BEGIN
  -- Only fire when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Get boat name
    SELECT name INTO v_boat_name FROM public.boats WHERE id = NEW.boat_id;

    -- Get customer name from guest_customers if available
    IF NEW.guest_customer_id IS NOT NULL THEN
      SELECT owner_name INTO v_customer_name FROM public.guest_customers WHERE id = NEW.guest_customer_id;
    END IF;

    -- Fallback to boat owner profile
    IF v_customer_name IS NULL THEN
      SELECT COALESCE(p.full_name, p.email, 'A customer')
        INTO v_customer_name
        FROM public.boats b
        JOIN public.profiles p ON p.id = b.owner_id
       WHERE b.id = NEW.boat_id;
    END IF;

    -- Insert notification for the provider (business owner)
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.provider_id,
      'Work Order Approved',
      COALESCE(v_customer_name, 'A customer') || ' approved the work order for ' || COALESCE(v_boat_name, 'their boat') || '.',
      'work_order',
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_notify_work_order_approved
  AFTER UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_work_order_approved();
