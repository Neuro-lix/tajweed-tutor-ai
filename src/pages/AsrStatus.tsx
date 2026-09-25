import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AsrStatus = () => (
  <main className="container max-w-3xl py-10 space-y-6">
    <h1 className="text-3xl font-semibold text-foreground">Moteur de reconnaissance : mode dégradé</h1>
    <p className="text-muted-foreground">
      Cette page explique quel moteur écoute ta récitation et ce que cela change pour la fiabilité des corrections.
    </p>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">État actuel <Badge variant="secondary">Mode dégradé</Badge></CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <p><strong>Moteur par défaut prévu :</strong> modèle spécialisé Coran (tarteel-ai/whisper-base-ar-quran), entraîné sur des récitations.</p>
        <p><strong>Moteur utilisé en ce moment :</strong> reconnaissance vocale générique, tant que le moteur Coran n'est pas joignable.</p>
        <p><strong>Pourquoi :</strong> la clé Hugging Face enregistrée n'a pas l'autorisation « Make calls to Inference Providers », ou n'a pas de crédit d'inférence.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Ce que ça change</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-foreground">
        <p><Badge className="bg-primary/15 text-primary border-primary/30 mr-2">Mesuré</Badge>Erreurs calculées dans le son (durée des madd, pause après qalqala). Elles n'apparaissent qu'avec le moteur Coran, qui donne le minutage de chaque mot.</p>
        <p><Badge variant="secondary" className="mr-2">Déduit</Badge>Erreurs proposées par l'IA à partir du texte entendu. En mode dégradé, toutes les erreurs sont de ce type.</p>
        <p className="text-muted-foreground">Aucune correction automatique ne remplace un professeur ou un cheikh.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Activer le moteur Coran</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Sur Hugging Face : Settings → Access Tokens → Create new token (type « Fine-grained »).</li>
          <li>Coche « Make calls to Inference Providers ».</li>
          <li>Ajoute un peu de crédit d'inférence sur ton compte Hugging Face.</li>
          <li>Donne ce jeton à l'assistant : il remplace la clé HUGGINGFACE_API_KEY.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button asChild><a href="https://huggingface.co/docs/inference-providers/index" target="_blank" rel="noreferrer">Guide Hugging Face</a></Button>
          <Button asChild variant="outline"><a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">Créer un jeton</a></Button>
          <Button asChild variant="ghost"><Link to="/">Retour</Link></Button>
        </div>
      </CardContent>
    </Card>
  </main>
);

export default AsrStatus;
