CREATE OR REPLACE FUNCTION public.claim_admin_access(_user_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN private.claim_admin_access(_user_id, _password);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_access(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_access(uuid, text) TO service_role;