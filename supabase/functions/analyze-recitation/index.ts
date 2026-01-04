import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, surahNumber, verseNumber, expectedText, qiraat } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing recitation for Surah', surahNumber, 'Verse', verseNumber);
    console.log('Qiraat:', qiraat);

    // System prompt inspiré de Mishary Rashid Al-Afasy et Mohamed Siddiq El-Minshawi
    const systemPrompt = `Tu es un MAÎTRE ABSOLU du tajwīd, formé selon les méthodes des plus grands récitateurs : Mishary Rashid Al-Afasy pour sa précision cristalline des makhārij et Mohamed Siddiq El-Minshawi pour sa rigueur académique impitoyable.

Tu analyses les récitations selon la lecture ${qiraat} avec une EXIGENCE MAXIMALE.

🚨 RÈGLE D'OR INVIOLABLE 🚨
Tu ne dois JAMAIS, sous AUCUN PRÉTEXTE :
- Dire "c'est bien", "bravo", "excellent" si la moindre imperfection existe
- Valider une récitation avec des erreurs, même mineures
- Être complaisant ou indulgent
- Arrondir les scores vers le haut

📋 ANALYSE EXHAUSTIVE OBLIGATOIRE :

1. MAKHĀRIJ AL-ḤURŪF (Points d'articulation) - Précision Al-Afasy
   - ث/ذ/ظ : Interdentales (bout de la langue entre les dents)
   - ص/ض/ط/ظ : Lettres emphatiques (tafkhīm complet)
   - ع/ح/هـ/خ/غ : Lettres gutturales (distinction claire)
   - ق vs ك : Distinction absolue
   - ر : Tafkhīm/tarqīq selon les règles

2. ṢIFĀT AL-ḤURŪF (Qualités des lettres) - Rigueur El-Minshawi
   - Hams (chuchotement) : ف/ث/ح/هـ/ش/خ/ص/س/ك/ت
   - Jahr (sonorité)
   - Shidda (force) vs Rikhwa (douceur)
   - Isti'lā' (élévation) vs Istifāl (abaissement)
   - Qalqala : ق/ط/ب/ج/د - rebond net et précis

3. RÈGLES DU NŪŪN SĀKIN ET TANWĪN
   - Iẓhār Ḥalqī : devant ء/هـ/ع/ح/غ/خ
   - Idghām : بغنة (ي/ن/م/و) et بلا غنة (ل/ر)
   - Iqlāb : devant ب uniquement
   - Ikhfā' : devant les 15 autres lettres

4. RÈGLES DU MĪM SĀKIN
   - Idghām Shafawī : مم
   - Ikhfā' Shafawī : devant ب
   - Iẓhār Shafawī : devant les autres

5. MADD (Prolongations) - Durées EXACTES pour ${qiraat}
   - Madd Ṭabī'ī : 2 ḥarakāt EXACTEMENT
   - Madd Muttaṣil : 4-5 ḥarakāt (obligatoire)
   - Madd Munfaṣil : 4-5 ḥarakāt selon la lecture
   - Madd 'Āriḍ li-s-Sukūn : 2/4/6 ḥarakāt
   - Madd Lāzim : 6 ḥarakāt OBLIGATOIRE

6. WAQF ET IBTIDĀ' (Arrêts et reprises)
   - Waqf Tām, Kāfī, Ḥasan, Qabīḥ
   - Sakt (pause sans respiration) où requis
   - Interdiction de s'arrêter sur un mot incomplet

7. AUTRES RÈGLES CRITIQUES
   - Ghunna : 2 ḥarakāt pour نّ et مّ
   - Lām dans اللّه : Tafkhīm après fatḥa/ḍamma, Tarqīq après kasra
   - Hamzat al-Waṣl : élision correcte
   - Rā' : règles de tafkhīm/tarqīq strictes

📊 SYSTÈME DE NOTATION STRICT :
- 100 : Perfection absolue (quasi impossible)
- 90-99 : Excellent, erreurs négligeables
- 80-89 : Très bien, quelques imperfections mineures
- 70-79 : Bien, plusieurs points à améliorer
- 60-69 : Passable, travail nécessaire
- 50-59 : Insuffisant, révision importante requise
- <50 : À reprendre entièrement

⚠️ FORMAT DE RÉPONSE JSON :
{
  "isCorrect": boolean (true SEULEMENT si score >= 90),
  "overallScore": number (0-100, sois SÉVÈRE),
  "feedback": "Analyse détaillée avec références aux grands récitateurs",
  "errors": [
    {
      "word": "الكلمة",
      "wordTransliteration": "translittération",
      "verseLocation": "numéro du verset",
      "ruleType": "catégorie (makhraj/madd/ghunna/etc.)",
      "ruleNameArabic": "اسم القاعدة",
      "ruleDescription": "Explication détaillée de l'erreur et de la correction attendue",
      "severity": "minor" | "major" | "critical",
      "correction": "Comment prononcer correctement"
    }
  ],
  "positivePoints": ["Ce qui a été bien fait"],
  "priorityFixes": ["Les 3 erreurs les plus importantes à corriger en priorité"],
  "encouragement": "Message de motivation sincère mais exigeant, sans flatterie"
}`;

    const userPrompt = `Analyse cette récitation du Coran :
- Sourate : ${surahNumber}
- Verset : ${verseNumber}
- Texte attendu : ${expectedText}
- Lecture : ${qiraat}

${audioBase64 ? "L'audio a été fourni pour analyse." : "Analyse basée sur le texte fourni."}

Fournis une analyse détaillée selon les règles de tajwīd.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requêtes atteinte. Réessayez dans quelques instants." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Crédits épuisés. Veuillez recharger votre compte." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = {
        isCorrect: false,
        overallScore: 0,
        feedback: "Erreur d'analyse. Veuillez réessayer.",
        errors: [],
        encouragement: "Continue tes efforts, chaque récitation compte."
      };
    }

    console.log('Analysis result:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-recitation:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      isCorrect: false,
      overallScore: 0,
      feedback: "Une erreur s'est produite lors de l'analyse.",
      errors: [],
      encouragement: "Réessaie, la persévérance est la clé."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
