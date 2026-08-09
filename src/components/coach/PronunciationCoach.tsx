import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Volume2, Turtle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { getRuleFamilyMeta, buildCoachingScript, ARTICULATION_TIP } from '@/lib/tajweedRules';

interface PronunciationCoachProps {
  /** Arabic word (or short segment) where the error was detected. */
  word?: string | null;
  ruleType: string;
  ruleDescription?: string | null;
  correction?: string | null;
  /** Compact layout for dense lists. */
  compact?: boolean;
}

type Action = 'word' | 'slow' | 'explain';

/**
 * Lets the learner HEAR the correct pronunciation of the exact word the AI
 * flagged (normal + slow) and listen to a spoken coaching explanation.
 */
export const PronunciationCoach = ({
  word,
  ruleType,
  ruleDescription,
  correction,
  compact = false,
}: PronunciationCoachProps) => {
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const [pending, setPending] = useState<Action | null>(null);
  const meta = getRuleFamilyMeta(ruleType);

  const run = async (action: Action) => {
    if (isSpeaking) stop();
    setPending(action);
    try {
      if (action === 'explain') {
        await speak(buildCoachingScript({ word, ruleType, ruleDescription, correction }), 'fr');
      } else {
        if (!word) return;
        await speak(word, 'ar', { speed: action === 'slow' ? 0.6 : 1 });
      }
    } catch {
      toast.error("Lecture audio indisponible pour le moment.");
    } finally {
      setPending(null);
    }
  };

  const icon = (a: Action, Fallback: typeof Volume2) =>
    pending === a ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fallback className="h-4 w-4" />;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-center gap-2">
        {word && (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={pending !== null}
              onClick={() => run('word')}
              aria-label={`Écouter la prononciation correcte de ${word}`}
            >
              {icon('word', Volume2)} Écouter le mot
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={pending !== null}
              onClick={() => run('slow')}
              aria-label={`Écouter ${word} au ralenti`}
            >
              {icon('slow', Turtle)} Au ralenti
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={pending !== null}
          onClick={() => run('explain')}
          aria-label="Écouter l'explication du coach"
        >
          {icon('explain', GraduationCap)} Coach audio
        </Button>
        {isSpeaking && (
          <Button type="button" size="sm" variant="ghost" onClick={stop}>
            Stop
          </Button>
        )}
      </div>

      {!compact && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className={meta.color}>
            {meta.label}
          </Badge>
          <span>{ARTICULATION_TIP[meta.family]}</span>
        </div>
      )}
    </div>
  );
};
