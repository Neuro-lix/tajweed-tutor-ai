import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GeometricPattern, Ornament } from '@/components/decorative/GeometricPattern';
import type { IndexState } from '../useIndexState';
import { renderHeroTitle } from '../indexHelpers';
import { PageSeo } from '@/components/seo/PageSeo';

interface LandingViewProps {
  state: IndexState;
}

export const LandingView = ({ state: s }: LandingViewProps) => {
  const { t } = s;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <PageSeo
        title="Tajweed Tutor AI — Coach IA de récitation du Coran"
        description="Améliore ta récitation du Coran avec un coach IA de tajwīd : analyse verset par verset, comparaison audio et suivi des 10 Qirā’āt."
        path="/"
      />
      <GeometricPattern className="text-primary" opacity={0.04} />

      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="absolute top-4 right-4 flex gap-2">
          {s.user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => s.setCurrentView('dashboard')}>
                {t.myDashboard}
              </Button>
              <Button variant="outline" size="sm" onClick={s.handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t.logout}
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                {t.login}
              </Button>
            </Link>
          )}
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in">
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={s.handleLogoClick}
              aria-label="Tajweed Tutor AI logo"
              className="rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src="/img/logo-192.webp"
                srcSet="/img/logo-96.webp 96w, /img/logo-192.webp 192w, /img/logo-384.webp 384w"
                sizes="96px"
                alt="Tajweed Tutor AI"
                width={96}
                height={96}
                fetchPriority="high"
                decoding="async"
                className="h-24 w-24 object-contain rounded-2xl"
              />
            </button>
          </div>
          {s.devMode && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 border border-secondary/40 rounded-full text-xs text-secondary font-medium">
                🛠️ {t.devModeActive}
              </div>
              <button onClick={() => s.setCurrentView('admin')} className="text-xs text-muted-foreground underline hover:text-primary transition-colors">
                ⚙️ {t.openAdminDashboard}
              </button>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {renderHeroTitle(t.heroTitle, t.heroRigor, t.heroKindness)}
          </h1>

          <Ornament className="mx-auto text-primary/40 my-8" />

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.heroDescription}
          </p>

          <Button
            variant="hero"
            size="xl"
            onClick={() => {
              if (s.user) {
                if (s.profile?.sessionType && s.profile?.selectedQiraat) {
                  s.setCurrentView('dashboard');
                } else {
                  s.setCurrentView('session-select');
                }
              } else {
                s.navigate('/auth');
              }
            }}
            className="animate-scale-in"
            style={{ animationDelay: '0.3s' }}
          >
            {s.user ? t.continueLearning : t.startLearning}
            <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                </svg>
              ),
              title: t.correctedRecitation,
              description: t.correctedRecitationDesc,
            },
            {
              icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M12 6v6M9 9h6" />
                </svg>
              ),
              title: t.tenCanonicalReadings,
              description: t.tenReadingsDesc,
            },
            {
              icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
              title: t.fullTrackingTitle,
              description: t.fullTrackingDesc,
            },
          ].map((feature, i) => (
            <Card
              key={i}
              variant="elevated"
              className="animate-slide-up"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h2>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Card
            variant="outline"
            className="inline-block px-8 py-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => s.user ? s.setCurrentView('pricing') : s.navigate('/auth')}
          >
            <p className="text-foreground">
              <span className="text-2xl font-bold text-primary">3€</span>
              <span className="text-muted-foreground"> {t.perHourAnalysis}</span>
            </p>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          {t.landingDisclaimer}
        </p>
      </main>
    </div>
  );
};
