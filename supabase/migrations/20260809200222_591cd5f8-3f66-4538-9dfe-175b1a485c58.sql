DROP FUNCTION IF EXISTS public.claim_admin_access(text);

CREATE OR REPLACE FUNCTION private.claim_admin_access(_user_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  _hash text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT password_hash INTO _hash FROM private.admin_access_secret WHERE id;

  IF _hash IS NULL OR _password IS NULL OR extensions.crypt(_password, _hash) <> _hash THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION private.claim_admin_access(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.claim_admin_access(uuid, text) TO service_role;

REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;