-- Drop and recreate view with security_invoker to fix security issue
DROP VIEW IF EXISTS public.boat_profiles_masked;

CREATE VIEW public.boat_profiles_masked
WITH (security_invoker = on) AS
SELECT 
    bp.id,
    bp.boat_id,
    bp.marina_name,
    bp.marina_address,
    bp.special_instructions,
    bp.created_at,
    bp.updated_at,
    -- Only show slip_number and gate_code if:
    -- 1. User owns the boat, OR
    -- 2. User is admin, OR  
    -- 3. User is a provider with an accepted quote for this boat
    CASE 
        WHEN owns_boat(bp.boat_id) OR is_admin() OR EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.boat_id = bp.boat_id 
            AND wo.provider_id = auth.uid()
            AND wo.escrow_status IN ('approved', 'work_started', 'pending_photos', 'pending_release', 'released')
        )
        THEN bp.slip_number
        ELSE '••••••'
    END as slip_number,
    CASE 
        WHEN owns_boat(bp.boat_id) OR is_admin() OR EXISTS (
            SELECT 1 FROM work_orders wo
            WHERE wo.boat_id = bp.boat_id 
            AND wo.provider_id = auth.uid()
            AND wo.escrow_status IN ('approved', 'work_started', 'pending_photos', 'pending_release', 'released')
        )
        THEN bp.gate_code
        ELSE '••••••'
    END as gate_code
FROM public.boat_profiles bp;

-- Grant access to the view
GRANT SELECT ON public.boat_profiles_masked TO authenticated;