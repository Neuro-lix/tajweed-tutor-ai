import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Star, Send, X, MessageSquareHeart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'general' | 'tajweed' | 'ux' | 'feature'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { id: 'general', label: 'Général', emoji: '💬' },
    { id: 'tajweed', label: 'Tajwīd', emoji: '📖' },
    { id: 'ux', label: 'Expérience', emoji: '✨' },
    { id: 'feature', label: 'Suggestion', emoji: '💡' },
  ];

  const handleSubmit = async () => {
    if (!feedback.trim() && rating === 0) {
      toast.error('Ajoute un commentaire ou une note');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('user_feedback').insert({
        user_id: user?.id || null,
        rating,
        feedback: feedback.trim(),
        category,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Merci pour ton retour ! Jazak Allah khayr');
      
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setRating(0);
        setFeedback('');
        setCategory('general');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Erreur lors de l\'envoi. Réessaie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Jazak Allah khayr !
            </h3>
            <p className="text-muted-foreground">
              Ton avis nous aide à améliorer l'application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Ton avis compte</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Rating */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Note ton expérience</p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-gold-warm fill-gold-warm'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Catégorie</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as typeof category)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    category === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Ton message (optionnel)</p>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Dis-nous ce que tu penses, tes suggestions d'amélioration..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!feedback.trim() && rating === 0)}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Envoi...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Envoyer mon avis
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
