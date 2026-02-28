import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, Globe, TrendingUp, Award, BookOpen, ShoppingBag, GripVertical, Settings, Eye, EyeOff, BarChart2, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  onBack: () => void;
}

interface UserStat {
  user_id: string;
  full_name: string | null;
  country_name: string | null;
  country_code: string | null;
  language: string | null;
  registered_at: string;
  total_sessions: number;
  avg_score: number;
  total_minutes: number;
  last_active: string | null;
}

interface DashStats {
  totalUsers: number;
  activeToday: number;
  avgSessionMin: number;
  totalRecitations: number;
  avgScore: number;
  ijazaRequests: number;
  topCountries: { name: string; code: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
  users: UserStat[];
}

const FLAG = (code: string) => {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E0 + c.charCodeAt(0) - 65));
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (min: number) => {
  if (min < 60) return min + " min";
  return Math.floor(min / 60) + "h " + (min % 60) + "min";
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "boutique">("overview");
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      // Users from profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, country_name, country_code, language, created_at")
        .order("created_at", { ascending: false });

      // Recitation sessions
      const { data: sessions } = await supabase
        .from("recitation_sessions")
        .select("user_id, accuracy_score, duration_minutes, created_at");

      // Ijaza requests
      const { data: ijaza } = await supabase
        .from("ijaza_requests")
        .select("id, created_at");

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

      // Top countries
      const countryCounts: Record<string, { name: string; code: string; count: number }> = {};
      (profiles || []).forEach(p => {
        if (p.country_code) {
          if (!countryCounts[p.country_code]) {
            countryCounts[p.country_code] = { name: p.country_name || p.country_code, code: p.country_code, count: 0 };
          }
          countryCounts[p.country_code].count++;
        }
      });
      const topCountries = Object.values(countryCounts).sort((a, b) => b.count - a.count).slice(0, 8);

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
          country_name: p.country_name,
          country_code: p.country_code,
          language: p.language,
          registered_at: p.created_at,
          total_sessions: userSessions.length,
          avg_score: userScores.length ? Math.round(userScores.reduce((a, b) => a + b, 0) / userScores.length) : 0,
          total_minutes: userSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
          last_active: lastSess,
        };
      });

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
      });
    } catch (e) {
      console.error("Admin stats error:", e);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

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
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 flex gap-1 pt-2">
          {[
            { key: "overview", label: "Vue d'ensemble", icon: BarChart2 },
            { key: "users", label: "Utilisateurs", icon: Users },
            { key: "boutique", label: "Boutique", icon: ShoppingBag },
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
        ) : (
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
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
