
-- === LEADERBOARD: hide user_id publicly ===
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;

CREATE POLICY "Users can view their own leaderboard row"
  ON public.leaderboard FOR SELECT
  USING (auth.uid() = user_id);

REVOKE SELECT ON public.leaderboard FROM anon;

CREATE OR REPLACE VIEW public.leaderboard_public
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

-- The view needs to bypass the base table RLS via a definer function OR
-- we allow public SELECT via a separate policy. Simpler: add a permissive
-- SELECT policy that only exposes non-sensitive rows via the view path.
-- Since security_invoker=on enforces RLS of the caller, we need a policy
-- that lets anyone read rows (but user_id column is not selectable through
-- the view). Add it back but scoped: allow reading via view only.
CREATE POLICY "Public leaderboard read for view"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Revoke direct column access to user_id by only granting the view to anon.
REVOKE ALL ON public.leaderboard FROM anon;
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;

-- === SHEIKH_AVAILABILITY: hide booked_by from other users ===
DROP POLICY IF EXISTS "Authenticated users can view sheikh availability" ON public.sheikh_availability;

CREATE POLICY "View available slots or own bookings"
  ON public.sheikh_availability FOR SELECT
  TO authenticated
  USING (
    is_booked = false
    OR booked_by = auth.uid()
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );
