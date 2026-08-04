-- 1. Remove the public SELECT policy on the base table
DROP POLICY IF EXISTS "Public can read leaderboard stats" ON public.leaderboard;

-- 2. Owner-only read on the base table
DROP POLICY IF EXISTS "Users can read their own leaderboard entry" ON public.leaderboard;
CREATE POLICY "Users can read their own leaderboard entry"
ON public.leaderboard
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Hard revoke direct access, keep only what policies need
REVOKE ALL ON public.leaderboard FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;

-- 4. The anonymized view must be able to read all rows -> definer semantics
ALTER VIEW public.leaderboard_public SET (security_invoker = off);
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;