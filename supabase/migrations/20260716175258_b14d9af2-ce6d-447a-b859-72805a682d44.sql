
-- Create a private schema not exposed by the Data API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies to reference private.has_role instead of public.has_role
-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

-- recitation_sessions
DROP POLICY IF EXISTS "Admins can view all recitation_sessions" ON public.recitation_sessions;
CREATE POLICY "Admins can view all recitation_sessions" ON public.recitation_sessions
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

-- ijaza_requests
DROP POLICY IF EXISTS "Admins can view all ijaza_requests" ON public.ijaza_requests;
CREATE POLICY "Admins can view all ijaza_requests" ON public.ijaza_requests
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

-- user_certificates
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.user_certificates;
CREATE POLICY "Admins can view all certificates" ON public.user_certificates
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'));

-- llm_usage
DROP POLICY IF EXISTS "Users read own llm usage" ON public.llm_usage;
CREATE POLICY "Users read own llm usage" ON public.llm_usage
  FOR SELECT USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

-- storage.objects (pdfs bucket)
DROP POLICY IF EXISTS "Admins can read pdfs" ON storage.objects;
CREATE POLICY "Admins can read pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs' AND private.has_role(auth.uid(), 'admin'));

-- Finally, drop the publicly-exposed function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
