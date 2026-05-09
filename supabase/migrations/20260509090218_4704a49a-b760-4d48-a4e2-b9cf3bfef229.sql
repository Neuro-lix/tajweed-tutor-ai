
-- 1) rate_limits: enable RLS + deny-all policies (only service_role bypasses RLS)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to rate_limits" ON public.rate_limits;
CREATE POLICY "No client access to rate_limits"
ON public.rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2) Revoke EXECUTE on SECURITY DEFINER internal helpers from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
-- has_role is used inside RLS expressions; keep callable
-- verify_certificate is intentionally public for the certificate verification page

-- 3) Replace overly permissive user_feedback INSERT policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;

CREATE POLICY "Anyone can submit feedback (constrained)"
ON public.user_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Anonymous inserts must not claim a user_id; authenticated must match auth.uid()
  (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
  AND (feedback IS NULL OR length(feedback) <= 5000)
  AND (rating IS NULL OR (rating BETWEEN 1 AND 5))
  AND (category IS NULL OR length(category) <= 50)
);
