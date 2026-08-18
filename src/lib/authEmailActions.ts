/**
 * Actions e-mail d'authentification (lien magique / réinitialisation).
 *
 * La logique est isolée ici — sans React ni dépendance directe au client
 * Supabase — afin de pouvoir la tester en intégration : bon type de template
 * demandé, limitation du nombre de tentatives, et échec propre en cas d'erreur.
 */

/** Nombre maximum d'envois autorisés pour une même adresse dans la session. */
export const MAX_EMAIL_ATTEMPTS = 3;
/** Délai (secondes) imposé entre deux envois. */
export const RESEND_COOLDOWN_SECONDS = 60;

export type AuthEmailTemplate = "magiclink" | "recovery" | "signup";

export interface AuthEmailAttempts {
  /** Nombre d'envois déjà effectués pour cette adresse. */
  count: number;
  /** Timestamp (ms) du dernier envoi réussi, ou null. */
  lastSentAt: number | null;
}

export interface AuthEmailResult {
  status: "sent" | "error" | "rate_limited" | "invalid_email";
  /** Template effectivement demandé au backend (null si aucun appel n'a eu lieu). */
  template: AuthEmailTemplate | null;
  message: string;
  attempts: AuthEmailAttempts;
  /** Secondes restantes avant de pouvoir réessayer (0 si possible immédiatement). */
  retryInSeconds: number;
  errorCode?: string | null;
}

/** Client minimal attendu (sous-ensemble de supabase.auth). */
export interface AuthEmailClient {
  signInWithOtp: (args: {
    email: string;
    options?: { emailRedirectTo?: string; shouldCreateUser?: boolean };
  }) => Promise<{ error: { message: string; code?: string; status?: number } | null }>;
  resetPasswordForEmail: (
    email: string,
    options?: { redirectTo?: string },
  ) => Promise<{ error: { message: string; code?: string; status?: number } | null }>;
}

export const emptyAttempts = (): AuthEmailAttempts => ({ count: 0, lastSentAt: null });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email: string): boolean => EMAIL_RE.test(email.trim());

/** Secondes restantes de cooldown pour un état de tentatives donné. */
export function cooldownRemaining(attempts: AuthEmailAttempts, now = Date.now()): number {
  if (!attempts.lastSentAt) return 0;
  const elapsed = Math.floor((now - attempts.lastSentAt) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
}

export const attemptsRemaining = (attempts: AuthEmailAttempts): number =>
  Math.max(0, MAX_EMAIL_ATTEMPTS - attempts.count);

interface SendOptions {
  template: AuthEmailTemplate;
  email: string;
  redirectTo: string;
  attempts: AuthEmailAttempts;
  now?: number;
}

/**
 * Envoie (ou renvoie) un e-mail d'authentification en appliquant la limitation
 * de tentatives, et renvoie systématiquement un état explicite réussite/échec.
 */
export async function sendAuthEmail(
  client: AuthEmailClient,
  { template, email, redirectTo, attempts, now = Date.now() }: SendOptions,
): Promise<AuthEmailResult> {
  const target = email.trim();

  if (!isValidEmail(target)) {
    return {
      status: "invalid_email",
      template: null,
      message: "Adresse e-mail invalide.",
      attempts,
      retryInSeconds: 0,
    };
  }

  if (attemptsRemaining(attempts) === 0) {
    return {
      status: "rate_limited",
      template: null,
      message: `Limite atteinte (${MAX_EMAIL_ATTEMPTS} envois). Réessaie dans quelques minutes ou contacte le support.`,
      attempts,
      retryInSeconds: 0,
    };
  }

  const wait = cooldownRemaining(attempts, now);
  if (wait > 0) {
    return {
      status: "rate_limited",
      template: null,
      message: `Patiente ${wait}s avant un nouvel envoi.`,
      attempts,
      retryInSeconds: wait,
    };
  }

  try {
    const { error } =
      template === "recovery"
        ? await client.resetPasswordForEmail(target, { redirectTo })
        : await client.signInWithOtp({
            email: target,
            options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
          });

    if (error) {
      console.error("[auth-email] send failed", {
        template,
        code: error.code ?? null,
        status: error.status ?? null,
        message: error.message,
      });
      return {
        status: "error",
        template,
        message: error.message || "L'envoi a échoué. Réessaie dans un instant.",
        attempts,
        retryInSeconds: 0,
        errorCode: error.code ?? null,
      };
    }

    const next: AuthEmailAttempts = { count: attempts.count + 1, lastSentAt: now };
    return {
      status: "sent",
      template,
      message:
        template === "recovery"
          ? `Lien de réinitialisation envoyé à ${target}.`
          : `Lien magique envoyé à ${target}.`,
      attempts: next,
      retryInSeconds: RESEND_COOLDOWN_SECONDS,
    };
  } catch (err) {
    console.error("[auth-email] send threw", err);
    return {
      status: "error",
      template,
      message: "Erreur réseau : l'envoi n'a pas abouti.",
      attempts,
      retryInSeconds: 0,
    };
  }
}

export const sendMagicLink = (
  client: AuthEmailClient,
  args: Omit<SendOptions, "template">,
) => sendAuthEmail(client, { ...args, template: "magiclink" });

export const sendPasswordReset = (
  client: AuthEmailClient,
  args: Omit<SendOptions, "template">,
) => sendAuthEmail(client, { ...args, template: "recovery" });
