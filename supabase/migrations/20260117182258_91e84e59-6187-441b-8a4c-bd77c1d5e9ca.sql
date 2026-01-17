-- Create ijaza_requests table for tracking Ijaza applications
CREATE TABLE public.ijaza_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sheikh_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT DEFAULT 'ar',
  preferred_time TEXT,
  experience TEXT,
  motivation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled', 'completed')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sheikhs table for managing available sheikhs
CREATE TABLE public.sheikhs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sheikh_availability table for scheduling
CREATE TABLE public.sheikh_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheikh_id UUID NOT NULL REFERENCES public.sheikhs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_certificates table for earned certificates
CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_number INTEGER NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'surah_mastery',
  user_name TEXT NOT NULL,
  qiraat TEXT DEFAULT 'hafs_asim',
  average_score DECIMAL(5,2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number, certificate_type)
);

-- Enable RLS
ALTER TABLE public.ijaza_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheikhs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheikh_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ijaza_requests
CREATE POLICY "Users can view their own ijaza requests"
ON public.ijaza_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ijaza requests"
ON public.ijaza_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
ON public.ijaza_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for sheikhs (public read)
CREATE POLICY "Anyone can view sheikhs"
ON public.sheikhs FOR SELECT
USING (true);

-- RLS Policies for sheikh_availability (public read)
CREATE POLICY "Anyone can view sheikh availability"
ON public.sheikh_availability FOR SELECT
USING (true);

-- RLS Policies for user_certificates
CREATE POLICY "Users can view their own certificates"
ON public.user_certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
ON public.user_certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert sample sheikhs
INSERT INTO public.sheikhs (name, specialty, languages, bio, is_available) VALUES
('Sheikh Ahmad Al-Tijani', 'Lecture Ḥafṣ ''an ''Āṣim', ARRAY['Arabe', 'Français', 'Anglais'], 'Diplômé de l''université Al-Azhar, 20 ans d''expérience', true),
('Sheikh Muhammad Al-Azhari', 'Lectures multiples (Qira''at)', ARRAY['Arabe', 'Anglais', 'Ourdou'], 'Spécialiste des 10 qira''at authentiques', true),
('Sheikh Yusuf Ibn Abdallah', 'Lecture Warsh ''an Nāfi''', ARRAY['Arabe', 'Français'], 'Expert en lecture Warsh, enseignant au Maroc', false);

-- Insert sample availability slots
INSERT INTO public.sheikh_availability (sheikh_id, day_of_week, start_time, end_time)
SELECT id, day, time_slot::time, (time_slot::time + interval '1 hour')::time
FROM public.sheikhs, 
     generate_series(0, 6) as day,
     unnest(ARRAY['09:00', '10:00', '14:00', '15:00', '20:00', '21:00']) as time_slot
WHERE is_available = true;

-- Trigger for updating timestamps
CREATE TRIGGER update_ijaza_requests_updated_at
BEFORE UPDATE ON public.ijaza_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();