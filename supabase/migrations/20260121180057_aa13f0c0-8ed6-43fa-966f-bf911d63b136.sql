-- Create provider approval audit log table
CREATE TABLE public.provider_approval_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approved' or 'rejected'
  verified_by UUID NOT NULL,
  verified_by_name TEXT,
  verified_by_email TEXT,
  coi_verified BOOLEAN NOT NULL DEFAULT false,
  w9_verified BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_approval_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage approval logs
CREATE POLICY "Admins can manage approval logs"
  ON public.provider_approval_logs
  FOR ALL
  USING (is_admin());

-- Create index for faster lookups
CREATE INDEX idx_provider_approval_logs_provider ON public.provider_approval_logs(provider_id);
CREATE INDEX idx_provider_approval_logs_created ON public.provider_approval_logs(created_at DESC);