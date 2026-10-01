import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type EngineStatus = { mode?: 'quran' | 'timestamps' | 'degraded'; engine?: string; reason?: string; measuredCount?: number; at?: number };

const STR = {
  fr: { title: 'Moteur de reconnaissance', intro: 'Quel moteur a écouté ta dernière récitation, et ce que cela change.', current: 'Dernière analyse', none: 'Aucune analyse encore. Récite un verset pour voir le moteur utilisé.', engine: 'Moteur', measured: 'Erreurs mesurées', modes: { quran: 'Moteur Coran', timestamps: 'Minutage mot par mot', degraded: 'Mode dégradé' }, desc: { quran: 'Modèle spécialisé Coran actif.', timestamps: "Moteur généraliste avec minutage de chaque mot : madd et qalqala peuvent être mesurés dans le son.", degraded: 'Moteur générique sans minutage : toutes les erreurs sont déduites par l’IA.' }, legend: 'Comprendre les étiquettes', m: 'Calculé dans le son (durée des madd, pause après qalqala).', i: "Proposé par l'IA à partir du texte entendu.", warn: 'Aucune correction automatique ne remplace un professeur ou un cheikh.', back: 'Retour' },
  en: { title: 'Recognition engine', intro: 'Which engine listened to your last recitation, and what it means.', current: 'Last analysis', none: 'No analysis yet. Recite a verse to see the engine used.', engine: 'Engine', measured: 'Measured errors', modes: { quran: 'Quran engine', timestamps: 'Word timing', degraded: 'Degraded mode' }, desc: { quran: 'Specialised Quran model active.', timestamps: 'General engine with per-word timing: madd and qalqala can be measured in the audio.', degraded: 'Generic engine without timing: all errors are inferred by AI.' }, legend: 'Understanding the labels', m: 'Computed from the audio (madd length, pause after qalqala).', i: 'Suggested by AI from the heard text.', warn: 'No automatic correction replaces a teacher or sheikh.', back: 'Back' },
};

const AsrStatus = () => {
  const { language } = useLanguage() as unknown as { language: string };
  const s = language === 'fr' ? STR.fr : STR.en;
  let st: EngineStatus | null = null;
  try { st = JSON.parse(localStorage.getItem('asr_engine_status') || 'null'); } catch { st = null; }
  const mode = st?.mode ?? null;

  return (
    <main className="container max-w-3xl py-10 space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">{s.title}</h1>
      <p className="text-muted-foreground">{s.intro}</p>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2">{s.current} {mode && <Badge variant={mode === 'degraded' ? 'secondary' : 'default'}>{s.modes[mode]}</Badge>}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          {!mode ? <p>{s.none}</p> : (
            <>
              <p>{s.desc[mode]}</p>
              {st?.engine && <p><strong>{s.engine} :</strong> {st.engine}</p>}
              {typeof st?.measuredCount === 'number' && <p><strong>{s.measured} :</strong> {st.measuredCount}</p>}
              {st?.at && <p className="text-muted-foreground">{new Date(st.at).toLocaleString(language)}</p>}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{s.legend}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          <p><Badge className="mr-2">✓</Badge>{s.m}</p>
          <p><Badge variant="secondary" className="mr-2">~</Badge>{s.i}</p>
          <p className="text-muted-foreground">{s.warn}</p>
          <Button asChild variant="ghost"><Link to="/">{s.back}</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AsrStatus;
