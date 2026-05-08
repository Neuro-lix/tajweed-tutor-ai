-- 1. Tighten ijaza_requests INSERT to authenticated only
DROP POLICY IF EXISTS "Users can create their own ijaza requests" ON public.ijaza_requests;
CREATE POLICY "Users can create their own ijaza requests"
ON public.ijaza_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. PDFs bucket: restrict direct SELECT to admins; signed URLs bypass RLS so user downloads still work
DROP POLICY IF EXISTS "Allow authenticated users to read pdfs" ON storage.objects;
CREATE POLICY "Admins can read pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pdfs' AND public.has_role(auth.uid(), 'admin'));

-- 3. Recitations bucket: explicit UPDATE policy (owner only)
DROP POLICY IF EXISTS "Users can update their own recitations" ON storage.objects;
CREATE POLICY "Users can update their own recitations"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'recitations' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'recitations' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated where not needed.
-- Trigger / internal-only functions:
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
-- has_role still needed by authenticated-context RLS evaluation; keep grant for authenticated.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
-- verify_certificate must remain public (anonymous verify page)
GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;

-- 5. Rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, action, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (user_id, action, window_start DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies: only service_role (used by edge functions) can read/write.

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max integer,
  p_window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  v_window_start := date_trunc('second', now()) - make_interval(secs => (extract(epoch FROM now())::int % p_window_seconds));
  INSERT INTO public.rate_limits (user_id, action, window_start, count)
  VALUES (p_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Cleanup old windows occasionally
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max,
    'count', v_count,
    'limit', p_max,
    'reset_at', v_window_start + make_interval(secs => p_window_seconds)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, public;
-- service_role implicitly has access