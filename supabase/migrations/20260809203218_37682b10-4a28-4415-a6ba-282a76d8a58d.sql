CREATE TABLE IF NOT EXISTS public.processed_payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id)
);

ALTER TABLE public.processed_payment_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.processed_payment_events FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.processed_payment_events TO service_role;