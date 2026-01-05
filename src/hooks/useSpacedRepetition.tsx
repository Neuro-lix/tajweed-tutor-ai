import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReviewItem {
  id: string;
  surahNumber: number;
  verseNumber: number;
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

// SM-2 Algorithm constants
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;

export const useSpacedRepetition = () => {
  const { user } = useAuth();
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [dueReviews, setDueReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviewQueue = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('review_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_date', { ascending: true });

      if (error) throw error;

      const items = (data || []).map(item => ({
        id: item.id,
        surahNumber: item.surah_number,
        verseNumber: item.verse_number,
        nextReviewDate: new Date(item.next_review_date),
        intervalDays: item.interval_days,
        easeFactor: Number(item.ease_factor),
        repetitions: item.repetitions,
      }));

      setReviewQueue(items);
      setDueReviews(items.filter(item => item.nextReviewDate <= new Date()));
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  const addToReviewQueue = async (surahNumber: number, verseNumber: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_queue')
        .upsert({
          user_id: user.id,
          surah_number: surahNumber,
          verse_number: verseNumber,
          next_review_date: new Date().toISOString(),
          interval_days: 1,
          ease_factor: INITIAL_EASE_FACTOR,
          repetitions: 0,
        }, {
          onConflict: 'user_id,surah_number,verse_number'
        });

      if (error) throw error;
      await fetchReviewQueue();
    } catch (error) {
      console.error('Error adding to review queue:', error);
    }
  };

  // SM-2 Algorithm implementation
  const processReview = async (itemId: string, quality: number) => {
    // quality: 0-5, where 0 = complete failure, 5 = perfect response
    if (!user) return;

    const item = reviewQueue.find(i => i.id === itemId);
    if (!item) return;

    let newEaseFactor = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

    let newRepetitions = item.repetitions;
    let newInterval = item.intervalDays;

    if (quality >= 3) {
      // Correct response
      if (item.repetitions === 0) {
        newInterval = 1;
      } else if (item.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(item.intervalDays * newEaseFactor);
      }
      newRepetitions++;
    } else {
      // Incorrect response - reset
      newRepetitions = 0;
      newInterval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    try {
      const { error } = await supabase
        .from('review_queue')
        .update({
          interval_days: newInterval,
          ease_factor: newEaseFactor,
          repetitions: newRepetitions,
          next_review_date: nextReviewDate.toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
      await fetchReviewQueue();
    } catch (error) {
      console.error('Error processing review:', error);
    }
  };

  const removeFromQueue = async (surahNumber: number, verseNumber: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_queue')
        .delete()
        .eq('user_id', user.id)
        .eq('surah_number', surahNumber)
        .eq('verse_number', verseNumber);

      if (error) throw error;
      await fetchReviewQueue();
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  };

  return {
    reviewQueue,
    dueReviews,
    loading,
    addToReviewQueue,
    processReview,
    removeFromQueue,
    refresh: fetchReviewQueue,
  };
};
