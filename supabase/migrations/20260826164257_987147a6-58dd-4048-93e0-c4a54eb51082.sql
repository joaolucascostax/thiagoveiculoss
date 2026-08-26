ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS body_type text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS vehicles_body_type_idx ON public.vehicles (body_type);