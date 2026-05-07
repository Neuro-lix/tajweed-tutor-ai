
-- Replace open SELECT with owner+admin policy
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.user_certificates;

CREATE POLICY "Users can view their own certificates"
  ON public.user_certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON public.user_certificates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public verification helper: returns ONE certificate by ID, no enumeration possible
CREATE OR REPLACE FUNCTION public.verify_certificate(p_id uuid)
RETURNS TABLE (
  id uuid,
  user_name text,
  surah_number integer,
  qiraat text,
  average_score numeric,
  completed_at timestamptz,
  certificate_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_name, surah_number, qiraat, average_score, completed_at, certificate_type
  FROM public.user_certificates
  WHERE id = p_id
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_certificate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;
