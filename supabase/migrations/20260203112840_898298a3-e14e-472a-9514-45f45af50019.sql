-- Create storage bucket for user recitations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recitations',
  'recitations',
  false,
  10485760, -- 10MB max per file
  ARRAY['audio/wav', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Create table to track user recitation recordings (metadata only, file in storage)
CREATE TABLE IF NOT EXISTS public.user_recitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  analysis_score INTEGER,
  qiraat TEXT DEFAULT 'hafs_asim',
  keep_recording BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_recitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_recitations
CREATE POLICY "Users can view their own recitations"
  ON public.user_recitations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recitations"
  ON public.user_recitations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recitations"
  ON public.user_recitations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recitations"
  ON public.user_recitations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for recitations bucket
CREATE POLICY "Users can upload their own recitations"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recitations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own recitations"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'recitations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own recitations"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recitations' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );