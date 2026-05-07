
-- 1) Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.deduct_credit(uuid) TO authenticated; -- still callable post-auth
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role kept callable by `authenticated` since RLS policies invoke it under user role.

-- 2) Attach signup triggers (functions existed but no triggers were bound)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- 3) Prevent fraudulent credit/transaction inserts from the client
DROP POLICY IF EXISTS "Users can insert their own credits"      ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can update their own credits"      ON public.user_credits;
-- (user_credits.UPDATE was also a write surface; balance is only changed by server functions)

-- 4) Hide booked_by from anonymous users on sheikh_availability
DROP POLICY IF EXISTS "Anyone can view sheikh availability" ON public.sheikh_availability;
CREATE POLICY "Authenticated users can view sheikh availability"
  ON public.sheikh_availability FOR SELECT
  TO authenticated
  USING (true);
