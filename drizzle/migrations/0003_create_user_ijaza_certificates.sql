CREATE TABLE public.user_ijaza_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  sheikh_name text NOT NULL,
  sanad text,
  riwaya text NOT NULL DEFAULT 'hafs_asim',
  scope text,
  issued_on date,
  certificate_number text,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ijaza_certificates TO authenticated;
GRANT ALL ON public.user_ijaza_certificates TO service_role;

ALTER TABLE public.user_ijaza_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ijaza certificates"
  ON public.user_ijaza_certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ijaza certificates"
  ON public.user_ijaza_certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ijaza certificates"
  ON public.user_ijaza_certificates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ijaza certificates"
  ON public.user_ijaza_certificates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_ijaza_certificates_user ON public.user_ijaza_certificates (user_id, created_at DESC);

CREATE TRIGGER update_user_ijaza_certificates_updated_at
  BEFORE UPDATE ON public.user_ijaza_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
