CREATE POLICY "Users read own ijaza docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ijaza-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own ijaza docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ijaza-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own ijaza docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ijaza-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
