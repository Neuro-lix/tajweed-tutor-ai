
DROP POLICY IF EXISTS "Public leaderboard read for view" ON public.leaderboard;

-- Recreate view as SECURITY DEFINER (default: security_invoker = off) so it
-- can read the base table while RLS restricts direct access to owners only.
DROP VIEW IF EXISTS public.leaderboard_public;

CREATE VIEW public.leaderboard_public AS
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
