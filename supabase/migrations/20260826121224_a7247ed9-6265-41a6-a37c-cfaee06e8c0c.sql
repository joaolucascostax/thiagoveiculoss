ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_external_id_key ON public.vehicles (external_id) WHERE external_id IS NOT NULL;

CREATE TABLE public.feed_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  deactivated_count integer NOT NULL DEFAULT 0,
  total_in_feed integer NOT NULL DEFAULT 0,
  error text
);

GRANT SELECT ON public.feed_imports TO authenticated;
GRANT ALL ON public.feed_imports TO service_role;

ALTER TABLE public.feed_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view feed imports" ON public.feed_imports
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));