import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/decorative/GeometricPattern';
import { PageSeo } from '@/components/seo/PageSeo';

interface RuleItem {
  arabic: string;
  name: string;
  text: string;
  example: string;
}

interface Section {
  id: string;
  title: string;
  intro: string;
  items: RuleItem[];
}

const SECTIONS: Section[] = [
  {
    id: 'makharij',
    title: 'Makhārij — les points d’articulation des lettres',
    intro:
      "Les makhārij (مخارج الحروف) sont les 17 points d’articulation répartis en 5 zones : la cavité buccale (al-jawf), la gorge (al-halq), la langue (al-lisān), les lèvres (ash-shafatān) et la cavité nasale (al-khayshūm). Prononcer une lettre au mauvais point change le mot et donc le sens du verset.",
    items: [
      {
        arabic: 'ء هـ',
        name: 'Gorge profonde (aqṣā al-ḥalq)',
        text: 'La hamza et le hā’ naissent du fond de la gorge, sans forcer la poitrine.',
        example: 'أَحَد — le hamza doit être net, jamais avalé.',
      },
      {
        arabic: 'ع ح',
        name: 'Milieu de la gorge (wasaṭ al-ḥalq)',
        text: '‘ayn et ḥā’ se distinguent par le degré de resserrement : ‘ayn plus doux, ḥā’ plus soufflé.',
        example: 'الْعَالَمِينَ — ne pas transformer le ‘ayn en hamza.',
      },
      {
        arabic: 'ص ض ط ظ',
        name: 'Lettres d’emphase (al-iṭbāq)',
        text: 'La langue se colle au palais : le son devient lourd (tafkhīm) et la voyelle s’assombrit.',
        example: 'الصِّرَاطَ — ṣād lourd, à ne pas confondre avec sīn.',
      },
      {
        arabic: 'ب م و',
        name: 'Lèvres (ash-shafatān)',
        text: 'Fermeture complète pour bā’ et mīm, arrondissement pour wāw.',
        example: 'مَالِكِ — mīm bien fermé avant l’ouverture.',
      },
    ],
  },
  {
    id: 'sifat',
    title: 'Ṣifāt — les qualités des lettres',
    intro:
      "Les ṣifāt (صفات الحروف) décrivent comment la lettre sort de son point d’articulation : voisement, souffle, force, emphase, rebond. Deux lettres peuvent partir du même makhraj et ne se distinguer que par leurs ṣifāt.",
    items: [
      {
        arabic: 'ق ط ب ج د',
        name: 'Qalqala — le rebond',
        text: 'Les cinq lettres qutb jad rebondissent légèrement lorsqu’elles portent un sukūn, sans ajouter de voyelle.',
        example: 'قُلْ أَعُوذُ… / أَحَدْ — rebond sec sur le dāl final.',
      },
      {
        arabic: 'همس',
        name: 'Hams — le souffle',
        text: 'Les lettres chuchotées (ف ح ث ه ش خ ص س ك ت) laissent passer le souffle ; ne pas les vocaliser.',
        example: 'سَلَامٌ — le sīn reste soufflé.',
      },
      {
        arabic: 'شدة / رخاوة',
        name: 'Shidda et rakhāwa',
        text: 'Shidda : le son est stoppé net. Rakhāwa : le son peut se prolonger. Confondre les deux allonge ou coupe le mot à tort.',
        example: 'الْحَقُّ — le qāf est ferme, pas étiré.',
      },
      {
        arabic: 'تفخيم / ترقيق',
        name: 'Tafkhīm et tarqīq',
        text: 'Le rā’ et le lām du nom d’Allāh s’alourdissent ou s’allègent selon la voyelle qui précède.',
        example: 'بِسْمِ اللَّهِ — lām allégé après kasra.',
      },
    ],
  },
  {
    id: 'madd',
    title: 'Madd — les allongements',
    intro:
      "Le madd (المد) est la prolongation d’une lettre de prolongation (ا و ي). Sa durée se compte en ḥarakāt (temps de voyelle). Allonger trop peu ou trop longtemps est l’erreur de tajwīd la plus fréquente chez les débutants.",
    items: [
      {
        arabic: '٢',
        name: 'Madd ṭabī‘ī (naturel)',
        text: '2 ḥarakāt, sans hamza ni sukūn après la lettre de prolongation. C’est la base de toute récitation.',
        example: 'قَالَ — deux temps sur le alif.',
      },
      {
        arabic: '٤ / ٥',
        name: 'Madd muttaṣil (connecté)',
        text: 'Une hamza suit la lettre de madd dans le même mot : 4 à 5 ḥarakāt, obligatoire.',
        example: 'السَّمَاءِ — allongement obligatoire avant la hamza.',
      },
      {
        arabic: '٢ / ٤ / ٥',
        name: 'Madd munfaṣil (séparé)',
        text: 'La hamza est au début du mot suivant. La durée dépend de la lecture (Ḥafṣ : 4 ou 5 ḥarakāt).',
        example: 'بِمَا أُنْزِلَ — garder la même durée sur toute la récitation.',
      },
      {
        arabic: '٦',
        name: 'Madd lāzim (obligatoire)',
        text: '6 ḥarakāt lorsqu’un sukūn permanent suit la lettre de madd, notamment dans les lettres isolées.',
        example: 'الٓمٓ — six temps sur le mīm.',
      },
    ],
  },
  {
    id: 'noun-sakina',
    title: 'Nūn sākina et tanwīn — idghām, iẓhār, iqlāb, ikhfā’',
    intro:
      "Quatre règles gouvernent la nūn sans voyelle et le tanwīn selon la lettre qui suit. Elles structurent la fluidité de la lecture et sont systématiquement vérifiées lors d’une ijāza.",
    items: [
      {
        arabic: 'إظهار',
        name: 'Iẓhār — prononciation claire',
        text: 'Devant les lettres de la gorge (ء هـ ع ح غ خ), la nūn se prononce distinctement, sans nasalisation prolongée.',
        example: 'مَنْ آمَنَ',
      },
      {
        arabic: 'إدغام',
        name: 'Idghām — assimilation',
        text: 'Devant ي ن م و (avec ghunna) et ل ر (sans ghunna), la nūn fusionne avec la lettre suivante.',
        example: 'مَن يَقُولُ',
      },
      {
        arabic: 'إقلاب',
        name: 'Iqlāb — transformation',
        text: 'Devant le bā’, la nūn devient un mīm nasalisé pendant 2 ḥarakāt.',
        example: 'مِنۢ بَعْدِ',
      },
      {
        arabic: 'إخفاء',
        name: 'Ikhfā’ — dissimulation',
        text: 'Devant les 15 lettres restantes, la nūn est atténuée avec une ghunna de 2 ḥarakāt.',
        example: 'مِن قَبْلُ',
      },
    ],
  },
  {
    id: 'waqf',
    title: 'Waqf — l’art de la pause',
    intro:
      "Le waqf (الوقف) détermine où s’arrêter sans altérer le sens. Les signes de pause du muṣḥaf (مـ ، ﻻ ، ج ، صلى ، قلى) guident la respiration du récitant.",
    items: [
      {
        arabic: 'مـ',
        name: 'Waqf lāzim',
        text: 'Arrêt obligatoire : continuer changerait le sens du verset.',
        example: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ',
      },
      {
        arabic: 'ﻻ',
        name: 'Waqf mamnū‘',
        text: 'Ne pas s’arrêter ici ; si le souffle manque, reprendre quelques mots en arrière.',
        example: 'signe ﻻ au-dessus du texte',
      },
      {
        arabic: 'ج',
        name: 'Waqf jā’iz',
        text: 'Pause permise : s’arrêter ou continuer sont équivalents.',
        example: 'signe ج au-dessus du texte',
      },
    ],
  },
];

const FAQ = [
  {
    q: 'Qu’est-ce que le tajwīd ?',
    a: "Le tajwīd est la science qui codifie la prononciation correcte du Coran : points d’articulation des lettres (makhārij), qualités des lettres (ṣifāt), allongements (madd) et règles de liaison et de pause.",
  },
  {
    q: 'Quelles sont les règles de tajwīd les plus importantes pour un débutant ?',
    a: "Commencer par les makhārij des lettres proches (ص/س, ط/ت, ع/ء), le madd naturel de 2 ḥarakāt, la qalqala et les quatre règles de la nūn sākina : iẓhār, idghām, iqlāb et ikhfā’.",
  },
  {
    q: 'Combien de temps faut-il pour maîtriser le tajwīd ?',
    a: "Avec 15 à 20 minutes de récitation corrigée par jour, les règles de base s’acquièrent en 3 à 6 mois. La maîtrise complète, validée par une ijāza, demande généralement plusieurs années de pratique auprès d’un enseignant.",
  },
  {
    q: 'Peut-on apprendre le tajwīd en ligne avec une IA ?',
    a: "Oui : une IA peut transcrire votre récitation, détecter les erreurs de makhārij, de madd et de ghunna verset par verset et vous faire répéter les passages fautifs. Elle ne remplace pas la certification par un cheikh, mais accélère fortement la phase d’entraînement quotidien.",
  },
];

const Tajwid = () => (
  <div className="min-h-screen bg-background relative">
    <PageSeo
      title="Règles du tajwīd : makhārij, ṣifāt et madd expliqués"
      description="Guide complet des règles de tajwīd : points d’articulation (makhārij), qualités des lettres (ṣifāt), allongements (madd), nūn sākina et waqf, avec exemples coraniques."
      path="/tajwid"
    />
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Règles du tajwīd : makhārij, ṣifāt et madd expliqués',
          inLanguage: 'fr',
          about: 'Tajwīd, récitation du Coran',
          mainEntityOfPage: 'https://recite-perfectly-bot.lovable.app/tajwid',
        })}
      </script>
    </Helmet>

    <GeometricPattern className="text-primary" opacity={0.03} />

    <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary underline-offset-4 hover:underline">
          Accueil
        </Link>
        <span className="mx-2">/</span>
        <span>Tajwīd</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Règles du tajwīd : makhārij, ṣifāt et madd
        </h1>
        <p className="text-lg text-muted-foreground">
          Apprendre le tajwīd, c’est apprendre à rendre à chaque lettre du Coran son droit. Ce guide
          rassemble les règles essentielles — points d’articulation, qualités des lettres,
          allongements, nūn sākina et pauses — avec des exemples tirés du muṣḥaf, pour progresser
          vers une récitation juste dans les dix Qirā’āt.
        </p>
      </header>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="text-base">Sommaire</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary hover:underline underline-offset-4">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">{section.title}</h2>
          <p className="text-muted-foreground mb-6">{section.intro}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
              <Card key={item.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <span dir="rtl" lang="ar" className="text-xl text-primary font-semibold">
                      {item.arabic}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                  <p dir="auto" className="text-sm text-foreground/80 border-l-2 border-primary/40 pl-3">
                    {item.example}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section id="faq" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Questions fréquentes</h2>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Mets ces règles en pratique dès aujourd’hui
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Récite un verset, l’IA transcrit ta lecture, détecte tes erreurs de makhārij, de madd et
            de ghunna, et te fait répéter exactement les passages à corriger.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth">Analyser ma récitation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/noorani-qaida">Débuter avec la Noorani Qaida</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default Tajwid;