CREATE TABLE public.recitation_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_hash text NOT NULL,
  surah_number integer NOT NULL,
  verse_number integer NOT NULL,
  qiraat text,
  session_type text,
  ui_language text,
  expected_text text NOT NULL,
  transcription text,
  engine text,
  word_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb,
  acoustic_measures jsonb NOT NULL DEFAULT '[]'::jsonb,
  detected_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer,
  audio_path text,
  duration_sec numeric,
  latency_ms integer,
  annotation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.recitation_samples TO authenticated;
GRANT ALL ON public.recitation_samples TO service_role;
ALTER TABLE public.recitation_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts and admins read samples" ON public.recitation_samples FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert'));
CREATE POLICY "Experts and admins update samples" ON public.recitation_samples FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert'));
CREATE INDEX recitation_samples_status_idx ON public.recitation_samples(annotation_status, created_at DESC);

CREATE TABLE public.sample_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES public.recitation_samples(id) ON DELETE CASCADE,
  annotator_id uuid NOT NULL,
  word_index integer,
  word text,
  rule_type text NOT NULL,
  verdict text NOT NULL,
  severity text,
  makhraj text,
  sifa text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.sample_annotations TO authenticated;
GRANT ALL ON public.sample_annotations TO service_role;
ALTER TABLE public.sample_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts read annotations" ON public.sample_annotations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert'));
CREATE POLICY "Experts add own annotations" ON public.sample_annotations FOR INSERT TO authenticated
  WITH CHECK (annotator_id = auth.uid() AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert')));
CREATE POLICY "Experts delete own annotations" ON public.sample_annotations FOR DELETE TO authenticated
  USING (annotator_id = auth.uid());

CREATE POLICY "Experts read dataset audio" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recitation-dataset' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert')));