-- Create spaced repetition review queue table
CREATE TABLE public.review_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number, verse_number)
);

-- Enable RLS
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own review queue"
ON public.review_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own review queue"
ON public.review_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review queue"
ON public.review_queue FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own review queue"
ON public.review_queue FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_queue_updated_at
BEFORE UPDATE ON public.review_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();