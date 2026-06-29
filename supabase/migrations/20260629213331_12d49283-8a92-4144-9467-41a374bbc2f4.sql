CREATE TABLE public.llm_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  model text,
  operation text NOT NULL DEFAULT 'chat',
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  credits_charged integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.llm_usage TO authenticated;
GRANT ALL ON public.llm_usage TO service_role;

ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage; admins can read everyone's.
CREATE POLICY "Users read own llm usage"
  ON public.llm_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies for authenticated: only service_role
-- (edge functions) writes to this table.

CREATE INDEX idx_llm_usage_user_created ON public.llm_usage (user_id, created_at DESC);
CREATE INDEX idx_llm_usage_function ON public.llm_usage (function_name);
CREATE INDEX idx_llm_usage_created ON public.llm_usage (created_at DESC);