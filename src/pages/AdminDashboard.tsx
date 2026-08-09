import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, TrendingUp, Award, BookOpen, ShoppingBag, Settings, BarChart2, Activity, RefreshCw, Target, AlertTriangle, Download, Radar as RadarIcon, CreditCard, Package, LineChart } from "lucide-react";
import { downloadFullSourceZip, getBundledFileCount } from "@/lib/downloadSource";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SURAHS } from "@/data/quranData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LlmCreditsTab } from "@/components/admin/LlmCreditsTab";
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate";

interface TajweedErrorBucket {
  category: string;
  count: number;
}

const TAJWEED_KEYWORDS: Record<string, string[]> = {
  Makhārij: ["makhrej", "makhraj", "makharij", "point d'articulation", "articulation", "prononciation", "lettre"],
  Ṣifāt: ["sifat", "sifa", "caractéristique", "qualité", "tafkhim", "tarqiq", "emphatique"],
  Mudūd: ["madd", "mad", "allongement", "prolongation", "voyelle longue"],
  Ghunna: ["ghunna", "nasalisation", "nasal"],
  Qalqala: ["qalqala", "qalqalah", "vibration", "écho"],
  Idghām: ["idgham", "idghām", "fusion", "assimilation"],
  Ikhfā: ["ikhfa", "ikhfā", "dissimulation", "occultation"],
  Iqlāb: ["iqlab", "iqlāb", "transformation"],
};

const classifyTajweedError = (text: string): string | null => {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(TAJWEED_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return null;
};

interface AdminDashboardProps {
  onBack: () => void;
}

interface UserStat {
  user_id: string;
  full_name: string | null;
  registered_at: string;
  total_sessions: number;
  avg_score: number;
  total_minutes: number;
  last_active: string | null;
}

interface SurahMetric {
  surahNumber: number;
  name: string;
  arabic: string;
  totalSessions: number;
  avgScore: number;
  successRate: number; // % of sessions with score >= 85
  errorRate: number;   // 100 - successRate
}

interface BusinessStats {
  retentionD7: { cohort: number; retained: number; rate: number };
  retentionD30: { cohort: number; retained: number; rate: number };
  payingUsers: number;
  conversionRate: number;
  paymentMethods: { method: string; count: number; pct: number }[];
  funnel: { signups: number; withSession: number; withPurchase: number };
}

interface DashStats {
  totalUsers: number;
  activeToday: number;
  avgSessionMin: number;
  totalRecitations: number;
  avgScore: number;
  ijazaRequests: number;
  registrationsByDay: { date: string; count: number }[];
  users: UserStat[];
  surahMetrics: SurahMetric[];
  tajweedErrorBuckets: TajweedErrorBucket[];
  business: BusinessStats;
}

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (min: number) => {
  if (min < 60) return min + " min";
  return Math.floor(min / 60) + "h " + (min % 60) + "min";
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "tajweed" | "boutique" | "credits">("overview");
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      // Users from profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at")
        .order("created_at", { ascending: false });

      // Recitation sessions (include surah_number for tajweed metrics)
      const { data: sessions } = await supabase
        .from("recitation_sessions")
        .select("user_id, surah_number, accuracy_score, duration_minutes, created_at");

      // Ijaza requests
      const { data: ijaza } = await supabase
        .from("ijaza_requests")
        .select("id, created_at");

      // Corrections (for tajweed error type radar)
      const { data: corrections } = await supabase
        .from("corrections")
        .select("rule_type, rule_description");

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      // Active today: users with session today
      const activeTodayIds = new Set(
        (sessions || [])
          .filter(s => s.created_at?.startsWith(todayStr))
          .map(s => s.user_id)
      );

      // Avg session duration
      const sessionDurations = (sessions || []).filter(s => s.duration_minutes).map(s => s.duration_minutes);
      const avgSessionMin = sessionDurations.length
        ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0;

      // Avg score
      const scores = (sessions || []).filter(s => s.accuracy_score).map(s => Number(s.accuracy_score));
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // Top countries - skipped since profiles table doesn't have country columns
      const topCountries: { name: string; code: string; count: number }[] = [];

      // Registrations by day (last 14 days)
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split("T")[0];
      });
      const regsByDay = last14.map(date => ({
        date,
        count: (profiles || []).filter(p => p.created_at?.startsWith(date)).length,
      }));

      // Per-user stats
      const userStats: UserStat[] = (profiles || []).map(p => {
        const userSessions = (sessions || []).filter(s => s.user_id === p.user_id);
        const userScores = userSessions.filter(s => s.accuracy_score).map(s => Number(s.accuracy_score));
        const lastSess = userSessions.length
          ? userSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          country_name: null,
          country_code: null,
          language: null,
          registered_at: p.created_at,
          total_sessions: userSessions.length,
          avg_score: userScores.length ? Math.round(userScores.reduce((a, b) => a + b, 0) / userScores.length) : 0,
          total_minutes: userSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
          last_active: lastSess,
        };
      });

      // Per-surah tajweed metrics (success rate = % sessions with score >= 85)
      const surahMap = new Map<number, { scores: number[]; total: number }>();
      (sessions || []).forEach((s: any) => {
        if (!s.surah_number) return;
        const entry = surahMap.get(s.surah_number) || { scores: [], total: 0 };
        entry.total += 1;
        if (s.accuracy_score != null) entry.scores.push(Number(s.accuracy_score));
        surahMap.set(s.surah_number, entry);
      });
      const surahMetrics: SurahMetric[] = Array.from(surahMap.entries()).map(([num, data]) => {
        const surah = SURAHS.find(s => s.id === num);
        const avg = data.scores.length
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0;
        const success = data.scores.length
          ? Math.round((data.scores.filter(s => s >= 85).length / data.scores.length) * 100)
          : 0;
        return {
          surahNumber: num,
          name: surah?.transliteration || `Sourate ${num}`,
          arabic: surah?.name || '',
          totalSessions: data.total,
          avgScore: avg,
          successRate: success,
          errorRate: 100 - success,
        };
      }).sort((a, b) => b.totalSessions - a.totalSessions);

      // Tajweed error buckets (radar chart)
      const bucketMap = new Map<string, number>();
      Object.keys(TAJWEED_KEYWORDS).forEach(k => bucketMap.set(k, 0));
      (corrections || []).forEach((c: any) => {
        const cat = classifyTajweedError(`${c.rule_type || ''} ${c.rule_description || ''}`);
        if (cat) bucketMap.set(cat, (bucketMap.get(cat) || 0) + 1);
      });
      const tajweedErrorBuckets: TajweedErrorBucket[] = Array.from(bucketMap.entries())
        .map(([category, count]) => ({ category, count }));

      setStats({
        totalUsers: (profiles || []).length,
        activeToday: activeTodayIds.size,
        avgSessionMin,
        totalRecitations: (sessions || []).length,
        avgScore,
        ijazaRequests: (ijaza || []).length,
        topCountries,
        registrationsByDay: regsByDay,
        users: userStats,
        surahMetrics,
        tajweedErrorBuckets,
      });
    } catch (e) {
      console.error("Admin stats error:", e);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadStats();
    else if (isAdmin === false) setLoading(false);
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification des droits…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminPasswordGate onBack={onBack} />;
  }

  const exportSurahMetricsCSV = () => {
    if (!stats?.surahMetrics?.length) return;
    const header = ["Sourate #", "Nom", "Arabe", "Sessions", "Score moyen (%)", "Taux de succes (%)", "Difficulte"];
    const rows = stats.surahMetrics.map(m => {
      const diff = m.successRate < 50 && m.totalSessions >= 3 ? "Difficile"
        : m.successRate >= 85 && m.totalSessions >= 3 ? "Maitrisee" : "Moyenne";
      return [m.surahNumber, `"${m.name}"`, `"${m.arabic}"`, m.totalSessions, m.avgScore, m.successRate, diff];
    });
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    // BOM for Excel UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tajweed-metriques-sourates-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxReg = stats?.registrationsByDay ? Math.max(...stats.registrationsByDay.map(d => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-bold">Dashboard Admin</span>
            <Badge variant="secondary">Privé</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={refreshing}>
            <RefreshCw className={"w-4 h-4 mr-2 " + (refreshing ? "animate-spin" : "")} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                toast.info(`Préparation de ${getBundledFileCount()} fichiers…`);
                await downloadFullSourceZip();
                toast.success("ZIP téléchargé");
              } catch (e) {
                toast.error("Échec du téléchargement");
                console.error(e);
              }
            }}
            title="Télécharger le code source complet en ZIP"
          >
            <Package className="w-4 h-4 mr-2" />
            Code (ZIP)
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 flex gap-1 pt-2">
          {[
            { key: "overview", label: "Vue d'ensemble", icon: BarChart2 },
            { key: "users", label: "Utilisateurs", icon: Users },
            { key: "tajweed", label: "Tajwīd par sourate", icon: Target },
            { key: "boutique", label: "Boutique", icon: ShoppingBag },
            { key: "credits", label: "💳 Crédits LLM", icon: CreditCard },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors " + (tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground animate-pulse">Chargement des stats...</div>
          </div>
        ) : !stats ? (
          <div className="text-center text-muted-foreground">Erreur de chargement</div>
        ) : tab === "overview" ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
                { label: "Actifs aujourd'hui", value: stats.activeToday, icon: Activity, color: "text-green-600" },
                { label: "Moy. session", value: fmtTime(stats.avgSessionMin), icon: Clock, color: "text-amber-600" },
                { label: "Récitations", value: stats.totalRecitations, icon: BookOpen, color: "text-purple-600" },
                { label: "Score moyen", value: stats.avgScore + "%", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Demandes Ijaza", value: stats.ijazaRequests, icon: Award, color: "text-rose-600" },
              ].map(kpi => (
                <Card key={kpi.label}>
                  <CardContent className="p-4 text-center space-y-2">
                    <kpi.icon className={"w-5 h-5 mx-auto " + kpi.color} />
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Registrations chart */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Inscriptions — 14 derniers jours</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {stats.registrationsByDay.map(d => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: Math.max(4, (d.count / maxReg) * 112) + "px" }}
                        title={d.date + " : " + d.count + " inscriptions"}
                      />
                      {d.count > 0 && <span className="text-xs text-primary font-medium">{d.count}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{stats.registrationsByDay[0]?.date}</span>
                  <span>Aujourd'hui</span>
                </div>
              </CardContent>
            </Card>

            {/* Countries */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Pays d'origine</CardTitle></CardHeader>
              <CardContent>
                {stats.topCountries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune donnée de localisation disponible encore. Les pays seront détectés automatiquement à l'inscription via l'IP.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topCountries.map(c => (
                      <div key={c.code} className="flex items-center gap-3">
                        <span className="text-xl">{FLAG(c.code)}</span>
                        <span className="text-sm font-medium w-32">{c.name}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: (c.count / stats.totalUsers * 100) + "%" }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : tab === "users" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{stats.users.length} utilisateurs inscrits</h2>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium">Utilisateur</th>
                      <th className="text-left p-3 font-medium">Pays</th>
                      <th className="text-left p-3 font-medium">Langue</th>
                      <th className="text-left p-3 font-medium">Inscrit le</th>
                      <th className="text-right p-3 font-medium">Sessions</th>
                      <th className="text-right p-3 font-medium">Score moy.</th>
                      <th className="text-right p-3 font-medium">Temps total</th>
                      <th className="text-left p-3 font-medium">Dernier accès</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map(u => (
                      <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <span className="font-medium">{u.full_name || "Anonyme"}</span>
                        </td>
                        <td className="p-3">
                          {u.country_code ? (
                            <span className="flex items-center gap-1">{FLAG(u.country_code)}<span className="text-xs text-muted-foreground">{u.country_name}</span></span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="p-3"><Badge variant="outline" className="text-xs">{u.language || "fr"}</Badge></td>
                        <td className="p-3 text-muted-foreground">{fmtDate(u.registered_at)}</td>
                        <td className="p-3 text-right font-medium">{u.total_sessions}</td>
                        <td className="p-3 text-right">
                          <span className={"font-medium " + (u.avg_score >= 80 ? "text-green-600" : u.avg_score >= 60 ? "text-amber-600" : "text-muted-foreground")}>
                            {u.total_sessions > 0 ? u.avg_score + "%" : "—"}
                          </span>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{fmtTime(u.total_minutes)}</td>
                        <td className="p-3 text-muted-foreground text-xs">{fmtDate(u.last_active)}</td>
                      </tr>
                    ))}
                    {stats.users.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Aucun utilisateur inscrit pour l'instant</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : tab === "tajweed" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <Target className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-2xl font-bold">{stats.surahMetrics.length}</p>
                  <p className="text-xs text-muted-foreground">Sourates pratiquées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <TrendingUp className="w-5 h-5 mx-auto text-emerald-600" />
                  <p className="text-2xl font-bold">
                    {stats.surahMetrics.length
                      ? Math.round(stats.surahMetrics.reduce((s, m) => s + m.successRate, 0) / stats.surahMetrics.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Taux de succès moyen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center space-y-1">
                  <AlertTriangle className="w-5 h-5 mx-auto text-amber-600" />
                  <p className="text-2xl font-bold">
                    {stats.surahMetrics.filter(m => m.successRate < 50 && m.totalSessions >= 3).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Sourates difficiles (succès &lt; 50%)</p>
                </CardContent>
              </Card>
            </div>

            {/* Radar chart - tajweed error types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RadarIcon className="w-4 h-4 text-primary" />
                  Répartition des types d'erreurs tajwīd
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Catégorisation automatique des corrections détectées par l'IA sur l'ensemble des sessions.
                </p>
              </CardHeader>
              <CardContent>
                {stats.tajweedErrorBuckets.every(b => b.count === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Pas encore de corrections tajwīd enregistrées.
                  </p>
                ) : (
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={stats.tajweedErrorBuckets}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Radar
                          name="Erreurs"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.4}
                        />
                        <ReTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Performance tajwīd par sourate
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Identifie les versets sur lesquels les élèves rencontrent le plus de difficultés.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSurahMetricsCSV}
                    disabled={!stats.surahMetrics.length}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Sourate</th>
                        <th className="text-right p-3 font-medium">Sessions</th>
                        <th className="text-right p-3 font-medium">Score moyen</th>
                        <th className="text-left p-3 font-medium w-1/3">Taux de succès</th>
                        <th className="text-right p-3 font-medium">Difficulté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.surahMetrics.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Pas encore de données de récitation</td></tr>
                      )}
                      {stats.surahMetrics.map(m => {
                        const isDifficult = m.successRate < 50 && m.totalSessions >= 3;
                        const isMastered = m.successRate >= 85 && m.totalSessions >= 3;
                        return (
                          <tr key={m.surahNumber} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-3 text-muted-foreground">{m.surahNumber}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{m.name}</span>
                                <span className="font-arabic text-base text-muted-foreground" dir="rtl">{m.arabic}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-medium">{m.totalSessions}</td>
                            <td className="p-3 text-right">
                              <span className={"font-medium " + (m.avgScore >= 85 ? "text-emerald-600" : m.avgScore >= 60 ? "text-amber-600" : "text-destructive")}>
                                {m.avgScore}%
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className={"h-2 rounded-full transition-all " + (m.successRate >= 70 ? "bg-emerald-600" : m.successRate >= 40 ? "bg-amber-600" : "bg-destructive")}
                                    style={{ width: m.successRate + "%" }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">{m.successRate}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {isDifficult ? (
                                <Badge variant="destructive" className="text-[10px]">Difficile</Badge>
                              ) : isMastered ? (
                                <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700">Maîtrisée</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">Moyenne</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : tab === "boutique" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Ventes boutique</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">L'intégration Paddle n'est pas encore activée. Une fois configurée, tu verras ici : revenus totaux, ventes par produit, conversions, remboursements.</p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {["Revenus totaux", "Ventes ce mois", "Produit populaire"].map(label => (
                    <div key={label} className="border rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-muted-foreground/40">—</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <LlmCreditsTab />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
