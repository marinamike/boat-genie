-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Platform admin full access on reviews" ON public.platform_reviews;

-- Create proper RLS policies for platform_reviews
-- Users can view non-deleted reviews
CREATE POLICY "Users can view non-deleted reviews"
ON public.platform_reviews
FOR SELECT
USING (is_deleted = false);

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
ON public.platform_reviews
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.platform_reviews
FOR UPDATE
USING (auth.uid() = reviewer_id);

-- Create a security definer function for platform admin checks
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'info@marinamike.com'
  )
$$;