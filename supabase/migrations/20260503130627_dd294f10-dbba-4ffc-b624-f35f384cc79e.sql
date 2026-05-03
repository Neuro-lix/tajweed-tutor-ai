ALTER TABLE public.user_recitations
ADD COLUMN IF NOT EXISTS envelope_similarity_score integer;

COMMENT ON COLUMN public.user_recitations.envelope_similarity_score IS 'Envelope similarity score (0-100) between user and reference recitation waveform.';