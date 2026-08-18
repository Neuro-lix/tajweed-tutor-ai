import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, MailCheck, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attemptsRemaining, MAX_EMAIL_ATTEMPTS, type AuthEmailAttempts } from "@/lib/authEmailActions";

interface EmailSentPanelProps {
  /** Adresse à laquelle l'e-mail a été envoyé. */
  email: string;
  title: string;
  description: string;
  attempts: AuthEmailAttempts;
  cooldown: number;
  sending: boolean;
  error?: string | null;
  onResend: () => void;
  onBack: () => void;
}

/**
 * Vue de confirmation d'envoi (lien de réinitialisation ou lien magique) :
 * confirme l'envoi et explique quoi faire si l'e-mail n'arrive pas.
 */
export const EmailSentPanel = ({
  email,
  title,
  description,
  attempts,
  cooldown,
  sending,
  error,
  onResend,
  onBack,
}: EmailSentPanelProps) => {
  const left = attemptsRemaining(attempts);
  const exhausted = left === 0;

  return (
    <div className="space-y-4 py-2" role="status" aria-live="polite">
      <div className="text-center space-y-2">
        <MailCheck className="w-12 h-12 text-green-500 mx-auto" />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          {description} <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
        <p className="text-sm font-medium">L'e-mail n'arrive pas ?</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <Search className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Vérifie les dossiers <strong>Spam</strong>, <strong>Promotions</strong> et{" "}
            <strong>Indésirables</strong>.
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            La livraison peut prendre jusqu'à <strong>5 minutes</strong> selon ta messagerie.
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Vérifie l'orthographe de l'adresse, puis redemande un lien ci-dessous.
          </li>
        </ul>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {!error && attempts.count > 1 && (
        <p className="flex items-start gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Nouvel envoi effectué ({attempts.count}/{MAX_EMAIL_ATTEMPTS}).
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onResend}
        disabled={sending || cooldown > 0 || exhausted}
      >
        {sending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours…</>
        ) : exhausted ? (
          "Limite d'envois atteinte"
        ) : cooldown > 0 ? (
          `Renvoyer le lien (${cooldown}s)`
        ) : (
          "Renvoyer le lien"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {exhausted
          ? "Réessaie dans quelques minutes ou écris-nous depuis la page Contact."
          : `${left} envoi${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}.`}
      </p>

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour à la connexion
      </Button>
    </div>
  );
};

export default EmailSentPanel;
