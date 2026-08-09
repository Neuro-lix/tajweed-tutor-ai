import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Target,
  Loader2,
  Trash2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageSeo } from '@/components/seo/PageSeo';
import { SpacedRepetitionPanel } from '@/components/review/SpacedRepetitionPanel';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useHifzGoal, type HifzTargetType } from '@/hooks/useHifzGoal';
import { SURAHS } from '@/data/quranData';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Monday-based start of the week containing `date`. */
const startOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const HifzPlan = () => {
  const navigate = useNavigate();
  const { reviewQueue, dueReviews, loading: reviewsLoading } = useSpacedRepetition();
  const { surahProgress } = useUserProgress();
  const { goal, loading: goalLoading, saving, saveGoal, clearGoal } = useHifzGoal();

  const [weekOffset, setWeekOffset] = useState(0);
  const [formType, setFormType] = useState<HifzTargetType>('surah');
  const [formSurah, setFormSurah] = useState<string>('1');
  const [formVerses, setFormVerses] = useState<string>('10');
  const [formDate, setFormDate] = useState<string>('');

  // ── Weekly calendar: spread the queue over the days of the shown week ──
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const items = reviewQueue.filter((r) => sameDay(r.nextReviewDate, date));
      // Overdue reviews all pile up on "today" so nothing gets lost off-calendar.
      const overdue =
        sameDay(date, today) && weekOffset === 0
          ? reviewQueue.filter((r) => r.nextReviewDate < startOfWeek(today))
          : [];
      return { date, label: DAY_LABELS[i], items: [...overdue, ...items], isToday: sameDay(date, today) };
    });
  }, [weekStart, weekOffset, reviewQueue]);

  // ── Progress towards the active goal ───────────────────────────────────
  const goalProgress = useMemo(() => {
    if (!goal) return null;
    if (goal.targetType === 'surah') {
      const surah = SURAHS.find((s) => s.id === goal.targetSurah);
      const p = surahProgress.find((s) => s.surahNumber === goal.targetSurah);
      const total = p?.totalVerses || surah?.verses || goal.targetValue || 1;
      const done = p?.masteredVerses ?? 0;
      return {
        label: surah ? `Sourate ${surah.transliteration}` : `Sourate ${goal.targetSurah}`,
        done,
        total,
        unit: 'versets mémorisés',
      };
    }
    // verses_per_week: count verses mastered since the start of the current week
    const total = goal.targetValue || 1;
    const done = reviewQueue.filter((r) => r.repetitions > 0).length;
    return {
      label: `${goal.targetValue} versets par semaine`,
      done: Math.min(done, total),
      total,
      unit: 'versets travaillés cette semaine',
    };
  }, [goal, surahProgress, reviewQueue]);

  const pct = goalProgress ? Math.min(100, Math.round((goalProgress.done / goalProgress.total) * 100)) : 0;

  const daysLeft = useMemo(() => {
    if (!goal?.targetDate) return null;
    const diff = new Date(goal.targetDate).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
  }, [goal]);

  const handleSave = () => {
    if (formType === 'surah') {
      const id = Number(formSurah);
      const surah = SURAHS.find((s) => s.id === id);
      saveGoal({
        targetType: 'surah',
        targetSurah: id,
        targetValue: surah?.verses ?? 1,
        targetDate: formDate || null,
      });
    } else {
      saveGoal({
        targetType: 'verses_per_week',
        targetValue: Math.max(1, Number(formVerses) || 1),
        targetDate: formDate || null,
      });
    }
  };

  const handleStartReview = (surahNumber: number, verseNumber: number) => {
    navigate(`/dashboard?surah=${surahNumber}&verse=${verseNumber}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Plan de mémorisation (Hifz) | Nassihah"
        description="Planifiez votre mémorisation du Coran : objectif personnalisé, calendrier hebdomadaire des révisions et suivi de progression."
        path="/hifz"
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-amiri font-bold text-foreground mb-2">Plan de mémorisation</h1>
          <p className="text-muted-foreground">
            Fixez un objectif de ḥifẓ, visualisez vos révisions de la semaine et suivez votre avancée.
          </p>
        </div>

        {/* ── Objective ─────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Mon objectif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : goal && goalProgress ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-lg">{goalProgress.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {goalProgress.done} / {goalProgress.total} {goalProgress.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                      <Badge variant={daysLeft < 0 ? 'destructive' : 'secondary'}>
                        {daysLeft < 0 ? 'Échéance dépassée' : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restants`}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearGoal} disabled={saving}>
                      <Trash2 className="w-4 h-4 mr-1" /> Changer
                    </Button>
                  </div>
                </div>
                <Progress value={pct} className="h-3" />
                <p className="text-sm text-primary font-medium">{pct}% de l'objectif atteint</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type d'objectif</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as HifzTargetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="surah">Mémoriser une sourate</SelectItem>
                      <SelectItem value="verses_per_week">Versets par semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formType === 'surah' ? (
                  <div className="space-y-2">
                    <Label>Sourate visée</Label>
                    <Select value={formSurah} onValueChange={setFormSurah}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-64">
                        {SURAHS.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.id}. {s.transliteration} ({s.verses} v.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="verses">Versets par semaine</Label>
                    <Input
                      id="verses"
                      type="number"
                      min={1}
                      value={formVerses}
                      onChange={(e) => setFormVerses(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="target-date">Échéance (optionnel)</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Définir mon objectif
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Weekly calendar ───────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Semaine du{' '}
              {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>‹</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Aujourd'hui</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>›</Button>
            </div>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {days.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={`rounded-lg border p-2 min-h-[120px] ${
                      day.isToday ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
                      <span className={`text-sm font-semibold ${day.isToday ? 'text-primary' : ''}`}>
                        {day.date.getDate()}
                      </span>
                    </div>
                    {day.items.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">—</p>
                    ) : (
                      <div className="space-y-1">
                        {day.items.slice(0, 3).map((item) => {
                          const surah = SURAHS.find((s) => s.id === item.surahNumber);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleStartReview(item.surahNumber, item.verseNumber)}
                              className="w-full text-left text-[11px] px-1.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors truncate"
                            >
                              {surah?.transliteration ?? `S${item.surahNumber}`} · v{item.verseNumber}
                            </button>
                          );
                        })}
                        {day.items.length > 3 && (
                          <p className="text-[11px] text-muted-foreground">+{day.items.length - 3}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Today's reviews: reuse the existing SM-2 panel ─────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SpacedRepetitionPanel
            dueReviews={dueReviews}
            totalInQueue={reviewQueue.length}
            onStartReview={handleStartReview}
          />
          <Card variant="elevated" className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Vue d'ensemble
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versets dans le programme</span>
                <span className="font-semibold">{reviewQueue.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">À réviser aujourd'hui</span>
                <span className="font-semibold text-primary">{dueReviews.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sourates entamées</span>
                <span className="font-semibold">
                  {surahProgress.filter((s) => s.status !== 'not_started').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versets maîtrisés</span>
                <span className="font-semibold">
                  {surahProgress.reduce((sum, s) => sum + (s.masteredVerses || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HifzPlan;
