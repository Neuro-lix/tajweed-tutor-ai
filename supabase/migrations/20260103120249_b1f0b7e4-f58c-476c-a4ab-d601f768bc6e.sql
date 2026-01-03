-- Create enum for session type
CREATE TYPE public.session_type AS ENUM ('male', 'female');

-- Create enum for qiraat type
CREATE TYPE public.qiraat_type AS ENUM (
  'hafs_asim',
  'warsh_nafi',
  'qalun',
  'al_duri',
  'al_susi',
  'ibn_kathir',
  'abu_amr',
  'ibn_amir',
  'hamzah',
  'al_kisai'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  session_type session_type,
  selected_qiraat qiraat_type DEFAULT 'hafs_asim',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hours NUMERIC DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_session_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create surah progress table
CREATE TABLE public.surah_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  mastered_verses INTEGER DEFAULT 0,
  total_verses INTEGER NOT NULL,
  last_recitation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number)
);

-- Create corrections table for tracking errors
CREATE TABLE public.corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create recitation sessions table
CREATE TABLE public.recitation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  start_verse INTEGER NOT NULL,
  end_verse INTEGER NOT NULL,
  duration_minutes INTEGER,
  accuracy_score NUMERIC,
  errors_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surah_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for surah_progress
CREATE POLICY "Users can view their own surah progress" 
ON public.surah_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own surah progress" 
ON public.surah_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surah progress" 
ON public.surah_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for corrections
CREATE POLICY "Users can view their own corrections" 
ON public.corrections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own corrections" 
ON public.corrections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own corrections" 
ON public.corrections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own corrections" 
ON public.corrections FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for recitation_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.recitation_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.recitation_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surah_progress_updated_at
  BEFORE UPDATE ON public.surah_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_progress (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();