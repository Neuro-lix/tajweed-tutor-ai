REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid, numeric) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid, numeric) TO service_role;