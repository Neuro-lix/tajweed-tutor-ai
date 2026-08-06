import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeometricPattern } from '@/components/decorative/GeometricPattern';
import { PageSeo } from '@/components/seo/PageSeo';
import { TajwidLinks } from '@/pages/tajweed/TajwidLinks';

const LESSONS = [
  {
    title: '1. Les 29 lettres de l’alphabet arabe',
    body: 'Apprends à reconnaître et prononcer chaque lettre (ا ب ت ث …) avec son point d’articulation (makhraj). Base indispensable avant tout tajwīd.',
  },
  {
    title: '2. Les voyelles courtes (Ḥarakāt)',
    body: 'Fatḥa, Kasra, Ḍamma — comment elles modifient le son de la lettre et pourquoi elles conditionnent une lecture correcte du Coran.',
  },
  {
    title: '3. Le Tanwīn et le Soukoun',
    body: 'Les doubles voyelles (ً ٍ ٌ) et l’absence de voyelle (ْ) : règles de prononciation et exemples tirés du Coran.',
  },
  {
    title: '4. Le Madd (allongement)',
    body: 'Madd Ṭabī‘ī, Madd Muttaṣil, Madd Munfaṣil : quand allonger 2, 4 ou 6 mouvements.',
  },
  {
    title: '5. Les règles du Nūn Sākinah et Tanwīn',
    body: 'Iẓhār, Idghām, Iqlāb, Ikhfā’ — les 4 règles fondamentales avec exemples audio.',
  },
  {
    title: '6. Les règles du Mīm Sākinah',
    body: 'Ikhfā’ Shafawī, Idghām Shafawī, Iẓhār Shafawī — reconnaître et appliquer chaque règle.',
  },
  {
    title: '7. Le Waqf (arrêts de récitation)',
    body: 'Comprendre les symboles ۖ ۗ ۚ ۛ ۜ et savoir où s’arrêter sans casser le sens.',
  },
  {
    title: '8. Exercices guidés par l’IA',
    body: 'Récite chaque leçon dans l’app : le coach IA détecte tes erreurs de makhārij, ṣifāt et madd et te propose un exemple corrigé.',
  },
];

const NooraniQaida = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <PageSeo
        title="Noorani Qaida en ligne — apprendre à lire le Coran avec l’IA"
        description="Cours interactif de Noorani Qaida : alphabet arabe, ḥarakāt, madd, nūn sākinah, mīm sākinah, waqf. Pratique guidée par un coach IA de tajwīd."
        path="/noorani-qaida"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'Noorani Qaida — Apprendre à lire le Coran',
          description: 'Cours interactif de Noorani Qaida avec pratique guidée par un coach IA de tajwīd.',
          provider: { '@type': 'Organization', name: 'Tajweed Tutor AI', url: 'https://recite-perfectly-bot.lovable.app/' },
          inLanguage: 'fr',
          educationalLevel: 'Débutant',
        })}</script>
      </Helmet>
      <GeometricPattern className="text-primary" opacity={0.04} />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </Link>
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold">Noorani Qaida</span>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Noorani Qaida en ligne
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            La méthode traditionnelle pour apprendre à lire le Coran, revisitée avec un
            coach IA qui écoute ta récitation et corrige ton tajwīd en temps réel.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="hero">
              <Sparkles className="w-4 h-4 mr-2" />
              Commencer gratuitement
            </Button>
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 mb-12">
          {LESSONS.map((l) => (
            <Card key={l.title} variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  {l.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{l.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="prose prose-sm dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Pourquoi apprendre le Noorani Qaida avec l’IA ?
          </h2>
          <p className="text-muted-foreground">
            Le Noorani Qaida est la porte d’entrée classique vers la lecture du Coran.
            Avec Tajweed Tutor AI, chaque leçon est renforcée par une analyse vocale :
            le modèle détecte tes erreurs de <em>makhārij</em>, <em>ṣifāt</em> et <em>madd</em>,
            te propose un exemple corrigé et t’aide à mémoriser durablement.
          </p>
          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">
            Programme adapté aux débutants
          </h2>
          <p className="text-muted-foreground">
            Les 8 modules couvrent l’alphabet arabe, les voyelles, le tanwīn, le soukoun,
            le madd, les règles du nūn sākinah et mīm sākinah, ainsi que les arrêts de
            récitation (waqf). Un vrai parcours structuré, sans prérequis.
          </p>
        </section>

        <TajwidLinks locale="fr" className="mt-12" />
      </main>
    </div>
  );
};

export default NooraniQaida;