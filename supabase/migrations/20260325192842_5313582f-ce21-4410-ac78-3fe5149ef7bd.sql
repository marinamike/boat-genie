
-- Add merge tracking columns to guest_customers
ALTER TABLE public.guest_customers
  ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS merged_to_user_id UUID DEFAULT NULL;

-- Update handle_new_user to merge guest customer data on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_guest RECORD;
  v_wo RECORD;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    -- Default new users to boat_owner role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'boat_owner');

    -- Merge guest customer records matching this email
    FOR v_guest IN
      SELECT id FROM public.guest_customers
      WHERE LOWER(owner_email) = LOWER(NEW.email)
        AND merged_at IS NULL
    LOOP
      -- Transfer boat ownership: find boats linked via work orders for this guest
      UPDATE public.boats
      SET owner_id = NEW.id, updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT boat_id FROM public.work_orders
        WHERE guest_customer_id = v_guest.id
      );

      -- Mark guest_customer as merged
      UPDATE public.guest_customers
      SET merged_at = NOW(), merged_to_user_id = NEW.id
      WHERE id = v_guest.id;
    END LOOP;

    RETURN NEW;
END;
$function$;
