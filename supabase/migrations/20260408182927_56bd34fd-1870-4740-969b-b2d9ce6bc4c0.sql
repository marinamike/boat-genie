
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service catalog"
ON public.service_catalog
FOR SELECT
TO anon, authenticated
USING (true);
