-- Lock down SECURITY DEFINER functions that should not be callable from the public API.
-- verify_certificate is only ever invoked by the verify-certificate edge function
-- using the service_role key, so revoke direct EXECUTE from anon and authenticated.
REVOKE EXECUTE ON FUNCTION public.verify_certificate(uuid) FROM anon, authenticated, public;

-- Ensure the other definer helpers remain restricted to service_role only
-- (they are called exclusively by edge functions / triggers).
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, public;