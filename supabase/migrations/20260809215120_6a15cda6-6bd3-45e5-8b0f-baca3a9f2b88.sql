CREATE TABLE public.hifz_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'surah',
  target_value integer NOT NULL DEFAULT 1,
  target_surah integer,
  target_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hifz_goals TO authenticated;
GRANT ALL ON public.hifz_goals TO service_role;

ALTER TABLE public.hifz_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hifz goals"
  ON public.hifz_goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hifz goals"
  ON public.hifz_goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hifz goals"
  ON public.hifz_goals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hifz goals"
  ON public.hifz_goals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_hifz_goals_user ON public.hifz_goals(user_id, is_active);

CREATE TRIGGER update_hifz_goals_updated_at
  BEFORE UPDATE ON public.hifz_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();