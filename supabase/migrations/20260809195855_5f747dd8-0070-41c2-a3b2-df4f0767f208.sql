CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.admin_access_secret (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.admin_access_secret ENABLE ROW LEVEL SECURITY;

INSERT INTO private.admin_access_secret (id, password_hash)
VALUES (true, extensions.crypt('Gff123456789!!!', extensions.gen_salt('bf', 10)))
ON CONFLICT (id) DO UPDATE
  SET password_hash = extensions.crypt('Gff123456789!!!', extensions.gen_salt('bf', 10)),
      updated_at = now();

CREATE OR REPLACE FUNCTION public.claim_admin_access(_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _hash text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT password_hash INTO _hash FROM private.admin_access_secret WHERE id;

  IF _hash IS NULL OR _password IS NULL OR extensions.crypt(_password, _hash) <> _hash THEN
    PERFORM pg_sleep(0.5);
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_access(text) TO authenticated;