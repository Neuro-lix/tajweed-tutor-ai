-- Allow public (unauthenticated) access to verify certificates
CREATE POLICY "Anyone can verify certificates"
ON public.user_certificates FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.user_certificates;

-- Add ON CONFLICT handling for handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_progress (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$function$;

-- Revoke direct client access to add_credits (should only be called by service_role via Edge Functions)
REVOKE EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER, TEXT) FROM anon;