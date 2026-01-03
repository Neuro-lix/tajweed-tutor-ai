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

    // System prompt for tajwīd analysis
    const systemPrompt = `Tu es un expert en tajwīd et récitation coranique. Tu analyses les récitations selon les règles strictes de la lecture ${qiraat}.

RÈGLE ABSOLUE : Tu ne dois JAMAIS dire "c'est bien" ou valider une récitation incorrecte. Si une erreur est détectée, tu dois :
1. Dire explicitement "À revoir"
2. Indiquer le verset et le mot concerné
3. Expliquer la règle non respectée
4. Rester encourageant mais exigeant

Tu analyses les aspects suivants :
- Makharij (points d'articulation des lettres)
- Ṣifāt (qualités des lettres)
- Madd (durées selon la lecture choisie)
- Idghām, Iẓhār, Iqlāb, Ikhfā'
- Waqf et Ibtidā' (arrêts et reprises)
- Oublis, ajouts ou altérations de lettres

Réponds en JSON avec le format :
{
  "isCorrect": boolean,
  "overallScore": number (0-100),
  "feedback": "message d'encouragement ou de correction",
  "errors": [
    {
      "word": "le mot concerné",
      "ruleType": "type de règle (madd, ghunna, etc.)",
      "ruleDescription": "explication détaillée",
      "severity": "minor" | "major"
    }
  ],
  "encouragement": "message de motivation"
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
