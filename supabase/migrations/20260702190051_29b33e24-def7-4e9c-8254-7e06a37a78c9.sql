ALTER TABLE public.user_recitations ADD COLUMN IF NOT EXISTS transcription text;
ALTER TABLE public.user_recitations ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;
ALTER TABLE public.corrections ADD COLUMN IF NOT EXISTS correction_example text;
ALTER TABLE public.corrections ADD COLUMN IF NOT EXISTS severity text;