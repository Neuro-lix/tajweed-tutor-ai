CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE (
  id uuid,
  display_name text,
  total_xp integer,
  current_level integer,
  total_verses_mastered integer,
  perfect_recitations integer,
  current_streak integer,
  longest_streak integer,
  rank_position integer,
  updated_at timestamptz,
  is_current_user boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.display_name, l.total_xp, l.current_level,
         l.total_verses_mastered, l.perfect_recitations,
         l.current_streak, l.longest_streak, l.rank_position, l.updated_at,
         (auth.uid() IS NOT NULL AND auth.uid() = l.user_id) AS is_current_user
  FROM public.leaderboard l;
$$;

REVOKE ALL ON FUNCTION public.get_public_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.leaderboard_public;
CREATE VIEW public.leaderboard_public
WITH (security_invoker = on) AS
SELECT * FROM public.get_public_leaderboard();

GRANT SELECT ON public.leaderboard_public TO anon, authenticated;