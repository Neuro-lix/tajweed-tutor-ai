import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Sample = {
  id: string; surah_number: number; verse_number: number; expected_text: string;
  transcription: string | null; score: number | null; audio_path: string | null;
  duration_sec: number | null; latency_ms: number | null; annotation_status: string;
  detected_errors: { word?: string; ruleType?: string; confidence?: string; ruleDescription?: string }[];
  acoustic_measures: { word: string; ruleType: string; ok: boolean; measurement: Record<string, number> }[];
  created_at: string;
};

const RULES = ['madd', 'ghunna', 'qalqala', 'makhraj', 'sifa', 'idgham', 'ikhfa', 'other'];
const CLASSIFIER_THRESHOLD = 200;

export const DatasetTab: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [stats, setStats] = useState({ total: 0, labeled: 0, hours: 0, perRule: {} as Record<string, number> });
  const [current, setCurrent] = useState<Sample | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [rule, setRule] = useState('madd');
  const [word, setWord] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('recitation_samples')
      .select('*').order('created_at', { ascending: false }).limit(200);
    const rows = (data ?? []) as unknown as Sample[];
    setSamples(rows);
    const { data: ann } = await supabase.from('sample_annotations').select('rule_type');
    const perRule: Record<string, number> = {};
    (ann ?? []).forEach((a) => { perRule[a.rule_type] = (perRule[a.rule_type] ?? 0) + 1; });
    setStats({
      total: rows.length,
      labeled: rows.filter((r) => r.annotation_status === 'done').length,
      hours: rows.reduce((s, r) => s + Number(r.duration_sec ?? 0), 0) / 3600,
      perRule,
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = async (s: Sample) => {
    setCurrent(s); setAudioUrl(null); setWord(''); setNote('');
    if (s.audio_path) {
      const { data } = await supabase.storage.from('recitation-dataset').createSignedUrl(s.audio_path, 600);
      setAudioUrl(data?.signedUrl ?? null);
    }
  };

  const annotate = async (verdict: 'confirmed' | 'false_positive' | 'missed', w?: string, r?: string) => {
    if (!current) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from('sample_annotations').insert({
      sample_id: current.id, annotator_id: u.user.id, word: (w ?? word) || null,
      rule_type: r ?? rule, verdict, note: note || null,
    });
    if (error) toast.error(error.message); else toast.success('Annotation enregistrée');
  };

  const finish = async () => {
    if (!current) return;
    await supabase.from('recitation_samples').update({ annotation_status: 'done' }).eq('id', current.id);
    setCurrent(null); load();
  };

  const exportJsonl = async () => {
    const { data: ann } = await supabase.from('sample_annotations').select('*');
    const bySample = new Map<string, unknown[]>();
    (ann ?? []).forEach((a) => { const l = bySample.get(a.sample_id) ?? []; l.push(a); bySample.set(a.sample_id, l); });
    const lines = samples.map((s) => JSON.stringify({
      id: s.id, audio: s.audio_path, surah: s.surah_number, ayah: s.verse_number,
      text: s.expected_text, transcription: s.transcription, words: (s as unknown as { word_timestamps: unknown }).word_timestamps,
      acoustic: s.acoustic_measures, model_errors: s.detected_errors, labels: bySample.get(s.id) ?? [],
    }));
    const blob = new Blob([lines.join('\n')], { type: 'application/jsonl' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nassihah-dataset.jsonl'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Échantillons</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Étiquetés</p><p className="text-2xl font-bold">{stats.labeled}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Heures d'audio</p><p className="text-2xl font-bold">{stats.hours.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Latence moy.</p><p className="text-2xl font-bold">{samples.length ? Math.round(samples.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / samples.length) : 0} ms</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Progression vers les classifieurs (seuil {CLASSIFIER_THRESHOLD} étiquettes / règle)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {RULES.map((r) => {
            const n = stats.perRule[r] ?? 0;
            return (
              <div key={r} className="flex items-center gap-3 text-sm">
                <span className="w-20">{r}</span>
                <div className="flex-1 h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (n / CLASSIFIER_THRESHOLD) * 100)}%` }} /></div>
                <span className="w-16 text-right text-muted-foreground">{n}/{CLASSIFIER_THRESHOLD}</span>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={exportJsonl}>Exporter le dataset (JSONL)</Button>
        </CardContent>
      </Card>

      {current ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Annotation — {current.surah_number}:{current.verse_number}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {audioUrl && <audio controls src={audioUrl} className="w-full" />}
            <p className="font-arabic text-2xl text-right" dir="rtl">{current.expected_text}</p>
            <p className="text-sm text-muted-foreground" dir="rtl">Entendu : {current.transcription ?? '—'}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Erreurs détectées par l'IA — valider ou rejeter :</p>
              {current.detected_errors.map((e, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm border border-border rounded p-2">
                  <span className="font-arabic" dir="rtl">{e.word}</span>
                  <Badge variant="outline">{e.ruleType}</Badge>
                  <Badge variant={e.confidence === 'measured' ? 'default' : 'secondary'}>{e.confidence === 'measured' ? 'Mesuré' : 'Déduit'}</Badge>
                  <span className="flex-1 text-muted-foreground">{e.ruleDescription}</span>
                  <Button size="sm" variant="outline" onClick={() => annotate('confirmed', e.word, e.ruleType)}>Juste</Button>
                  <Button size="sm" variant="ghost" onClick={() => annotate('false_positive', e.word, e.ruleType)}>Faux</Button>
                </div>
              ))}
              {!current.detected_errors.length && <p className="text-sm text-muted-foreground">Aucune erreur détectée.</p>}
            </div>
            <div className="flex flex-wrap gap-2 items-center border-t border-border pt-3">
              <span className="text-sm">Erreur manquée :</span>
              <input className="border border-input bg-background rounded px-2 py-1 text-sm font-arabic" dir="rtl" placeholder="mot" value={word} onChange={(e) => setWord(e.target.value)} />
              <select className="border border-input bg-background rounded px-2 py-1 text-sm" value={rule} onChange={(e) => setRule(e.target.value)}>
                {RULES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <input className="border border-input bg-background rounded px-2 py-1 text-sm flex-1" placeholder="note (makhraj, ṣifa…)" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" onClick={() => annotate('missed')} disabled={!word}>Ajouter</Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={finish}>Terminer l'échantillon</Button>
              <Button variant="ghost" onClick={() => setCurrent(null)}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Échantillons à annoter</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {samples.map((s) => (
              <button key={s.id} onClick={() => open(s)} className="w-full flex items-center gap-3 text-sm p-2 rounded hover:bg-muted text-left">
                <span className="w-16">{s.surah_number}:{s.verse_number}</span>
                <span className="w-14">{s.score ?? '—'}/100</span>
                <span className="flex-1 text-muted-foreground">{s.detected_errors.length} erreur(s)</span>
                <Badge variant={s.annotation_status === 'done' ? 'default' : 'outline'}>{s.annotation_status === 'done' ? 'étiqueté' : 'à faire'}</Badge>
              </button>
            ))}
            {!samples.length && <p className="text-sm text-muted-foreground">Aucun échantillon pour l'instant — ils arrivent quand des utilisateurs activent « Contribuer à améliorer l'IA ».</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
