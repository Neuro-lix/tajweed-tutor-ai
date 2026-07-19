
DROP VIEW IF EXISTS public.leaderboard_public;

CREATE VIEW public.leaderboard_public
WITH (security_invoker = on) AS
SELECT
  id,
  display_name,
  total_xp,
  current_level,
  total_verses_mastered,
  perfect_recitations,
  current_streak,
  longest_streak,
  rank_position,
  updated_at,
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) AS is_current_user
FROM public.leaderboard;

GRANT SELECT ON public.leaderboard_public TO anon, authenticated;

-- Allow public read of leaderboard rows, but block direct access to user_id column
DROP POLICY IF EXISTS "Users can view their own leaderboard row" ON public.leaderboard;
CREATE POLICY "Public can read leaderboard stats"
  ON public.leaderboard FOR SELECT
  USING (true);

REVOKE SELECT ON public.leaderboard FROM anon, authenticated;
GRANT SELECT (id, display_name, total_xp, current_level, total_verses_mastered,
              perfect_recitations, current_streak, longest_streak, rank_position, updated_at)
  ON public.leaderboard TO anon, authenticated;
-- Allow authenticated users to see their own user_id (needed for upsert conflict checks)
GRANT SELECT (user_id) ON public.leaderboard TO authenticated;
-- Note: RLS still applies; combined with column grants, anon cannot read user_id at all,
-- and authenticated users can only see it via queries that filter to their own rows in app code.
-- To fully block user_id even for authenticated users on other rows, we rely on app queries
-- going through leaderboard_public instead.
