
-- 1. Drop RLS policies that reference provider_id or old wish_form_status values
DROP POLICY IF EXISTS "Requesters and businesses can view wish forms" ON public.wish_forms;
DROP POLICY IF EXISTS "Requesters and admins can view wish forms" ON public.wish_forms;
DROP POLICY IF EXISTS "Providers can view boats with available wishes" ON public.boats;

-- 2. Drop columns
ALTER TABLE public.wish_forms DROP COLUMN IF EXISTS provider_id;
ALTER TABLE public.wish_forms DROP COLUMN IF EXISTS work_order_id;

-- 3. Replace wish_form_status enum
ALTER TABLE public.wish_forms ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.wish_forms ALTER COLUMN status TYPE text;
UPDATE public.wish_forms SET status = 'open' WHERE status IN ('submitted', 'reviewed');
UPDATE public.wish_forms SET status = 'accepted' WHERE status IN ('approved', 'converted');
UPDATE public.wish_forms SET status = 'closed' WHERE status = 'rejected';
DROP TYPE IF EXISTS public.wish_form_status;
CREATE TYPE public.wish_form_status AS ENUM ('open', 'accepted', 'closed');
ALTER TABLE public.wish_forms ALTER COLUMN status TYPE public.wish_form_status USING status::public.wish_form_status;
ALTER TABLE public.wish_forms ALTER COLUMN status SET DEFAULT 'open';

-- 4. Replace quote_status enum
ALTER TABLE public.quotes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.quotes ALTER COLUMN status TYPE text;
UPDATE public.quotes SET status = 'declined' WHERE status IN ('rejected', 'expired');
DROP TYPE IF EXISTS public.quote_status;
CREATE TYPE public.quote_status AS ENUM ('pending', 'accepted', 'declined');
ALTER TABLE public.quotes ALTER COLUMN status TYPE public.quote_status USING status::public.quote_status;
ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'pending';

-- 5. Recreate RLS policies with new enum values
CREATE POLICY "Requesters and admins can view wish forms"
  ON public.wish_forms FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR is_admin());

CREATE POLICY "Providers can view boats with available wishes"
  ON public.boats FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'provider') AND EXISTS (
      SELECT 1 FROM public.wish_forms wf
      WHERE wf.boat_id = boats.id AND wf.status = 'open'
    )
  );
