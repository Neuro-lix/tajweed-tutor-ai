
DROP POLICY IF EXISTS "Users can create their own certificates" ON public.user_certificates;
CREATE POLICY "Users can create their own certificates"
ON public.user_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND average_score >= 90
  AND certificate_type IN ('surah_mastery', 'juz_mastery', 'quran_completion')
);
