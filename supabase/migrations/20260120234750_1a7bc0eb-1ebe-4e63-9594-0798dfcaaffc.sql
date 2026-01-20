-- Allow users to update their own roles (for onboarding flow)
CREATE POLICY "Users can update their own role"
ON public.user_roles FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to insert their own role if not exists
CREATE POLICY "Users can insert their own role"  
ON public.user_roles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Provider can also view marina slips for launch operations
CREATE POLICY "Providers can view slips for launch ops"
ON public.marina_slips FOR SELECT
USING (has_role(auth.uid(), 'provider'::app_role));

-- Providers can view launch queue for their operations
CREATE POLICY "Providers can view launch queue"
ON public.launch_queue FOR SELECT
USING (has_role(auth.uid(), 'provider'::app_role));

-- Providers can view launch cards they're assigned to
CREATE POLICY "Providers can view launch cards"
ON public.launch_cards FOR SELECT
USING (has_role(auth.uid(), 'provider'::app_role));