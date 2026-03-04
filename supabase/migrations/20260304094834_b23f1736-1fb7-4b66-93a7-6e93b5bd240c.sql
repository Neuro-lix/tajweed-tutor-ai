INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated users to read pdfs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pdfs');