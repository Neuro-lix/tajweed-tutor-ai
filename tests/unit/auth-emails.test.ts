import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_EMAIL_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  cooldownRemaining,
  emptyAttempts,
  sendAuthEmail,
  sendMagicLink,
  sendPasswordReset,
  type AuthEmailClient,
} from "../../src/lib/authEmailActions";

const hookSource = readFileSync(
  new URL("../../supabase/functions/auth-email-hook/index.ts", import.meta.url),
  "utf8",
);

const makeClient = (overrides: Partial<AuthEmailClient> = {}): AuthEmailClient & {
  signInWithOtp: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
} => ({
  signInWithOtp: vi.fn(async () => ({ error: null })),
  resetPasswordForEmail: vi.fn(async () => ({ error: null })),
  ...overrides,
}) as never;

const base = { email: "user@example.com", redirectTo: "https://tajweedtutorai.com/" };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("auth email hook — template wiring", () => {
  it("declares the six auth action types", () => {
    for (const type of ["signup", "invite", "magiclink", "recovery", "email_change", "reauthentication"]) {
      expect(hookSource).toContain(`${type}:`);
    }
  });

  it("maps each action type to its own React Email template", () => {
    for (const component of [
      "SignupEmail",
      "InviteEmail",
      "MagicLinkEmail",
      "RecoveryEmail",
      "EmailChangeEmail",
      "ReauthenticationEmail",
    ]) {
      expect(hookSource).toContain(`React.createElement(${component}`);
    }
  });

  it("sends from the verified sender domain with the managed handler", () => {
    expect(hookSource).toContain("createAuthEmailHandler");
    expect(hookSource).toContain('const SENDER_DOMAIN = "notify.tajweedtutorai.com"');
    expect(hookSource).not.toContain("enqueue_email");
  });

  it("rejects unauthenticated preview requests and unknown template types", () => {
    expect(hookSource).toContain("Unauthorized");
    expect(hookSource).toContain("Unknown email type");
  });
});

describe("magic link — correct template requested", () => {
  it("calls signInWithOtp without creating a new user", async () => {
    const client = makeClient();
    const res = await sendMagicLink(client, { ...base, attempts: emptyAttempts() });

    expect(res.status).toBe("sent");
    expect(res.template).toBe("magiclink");
    expect(client.signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: { emailRedirectTo: base.redirectTo, shouldCreateUser: false },
    });
    expect(client.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("routes the recovery template to resetPasswordForEmail", async () => {
    const client = makeClient();
    const res = await sendPasswordReset(client, { ...base, attempts: emptyAttempts() });

    expect(res.template).toBe("recovery");
    expect(client.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: base.redirectTo,
    });
    expect(client.signInWithOtp).not.toHaveBeenCalled();
  });

  it("trims the address before sending", async () => {
    const client = makeClient();
    await sendMagicLink(client, { ...base, email: "  user@example.com  ", attempts: emptyAttempts() });
    expect(client.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
    );
  });
});

describe("attempt limiting", () => {
  it("imposes a cooldown between two sends", async () => {
    const client = makeClient();
    const now = 1_000_000;
    const first = await sendMagicLink(client, { ...base, attempts: emptyAttempts(), now });
    expect(first.status).toBe("sent");
    expect(first.retryInSeconds).toBe(RESEND_COOLDOWN_SECONDS);

    const second = await sendMagicLink(client, { ...base, attempts: first.attempts, now: now + 5_000 });
    expect(second.status).toBe("rate_limited");
    expect(second.retryInSeconds).toBe(RESEND_COOLDOWN_SECONDS - 5);
    expect(client.signInWithOtp).toHaveBeenCalledTimes(1);
  });

  it("allows a new send once the cooldown elapsed", async () => {
    const client = makeClient();
    const now = 1_000_000;
    const first = await sendMagicLink(client, { ...base, attempts: emptyAttempts(), now });
    const later = await sendMagicLink(client, {
      ...base,
      attempts: first.attempts,
      now: now + (RESEND_COOLDOWN_SECONDS + 1) * 1000,
    });
    expect(later.status).toBe("sent");
    expect(later.attempts.count).toBe(2);
  });

  it("blocks after MAX_EMAIL_ATTEMPTS and never calls the backend again", async () => {
    const client = makeClient();
    let attempts = emptyAttempts();
    let now = 1_000_000;

    for (let i = 0; i < MAX_EMAIL_ATTEMPTS; i++) {
      const res = await sendMagicLink(client, { ...base, attempts, now });
      expect(res.status).toBe("sent");
      attempts = res.attempts;
      now += (RESEND_COOLDOWN_SECONDS + 1) * 1000;
    }

    const blocked = await sendMagicLink(client, { ...base, attempts, now });
    expect(blocked.status).toBe("rate_limited");
    expect(blocked.template).toBeNull();
    expect(client.signInWithOtp).toHaveBeenCalledTimes(MAX_EMAIL_ATTEMPTS);
  });

  it("computes the remaining cooldown from the last successful send", () => {
    const now = 2_000_000;
    expect(cooldownRemaining({ count: 1, lastSentAt: now }, now)).toBe(RESEND_COOLDOWN_SECONDS);
    expect(cooldownRemaining({ count: 1, lastSentAt: null }, now)).toBe(0);
    expect(cooldownRemaining({ count: 1, lastSentAt: now - 999_000 }, now)).toBe(0);
  });
});

describe("clean failures", () => {
  it("returns an error state (not a throw) when the backend rejects", async () => {
    const client = makeClient({
      signInWithOtp: vi.fn(async () => ({
        error: { message: "Email rate limit exceeded", code: "over_email_send_rate_limit", status: 429 },
      })),
    });
    const res = await sendMagicLink(client, { ...base, attempts: emptyAttempts() });

    expect(res.status).toBe("error");
    expect(res.errorCode).toBe("over_email_send_rate_limit");
    expect(res.message).toContain("rate limit");
    // Un échec ne consomme pas de tentative et ne démarre pas de cooldown.
    expect(res.attempts).toEqual(emptyAttempts());
    expect(res.retryInSeconds).toBe(0);
  });

  it("recovers from a thrown network error", async () => {
    const client = makeClient({
      resetPasswordForEmail: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    const res = await sendPasswordReset(client, { ...base, attempts: emptyAttempts() });

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/réseau/i);
    expect(res.attempts.count).toBe(0);
  });

  it("refuses an invalid address without hitting the backend", async () => {
    const client = makeClient();
    for (const email of ["", "nope", "a@b", "a b@c.com"]) {
      const res = await sendAuthEmail(client, {
        template: "magiclink",
        email,
        redirectTo: base.redirectTo,
        attempts: emptyAttempts(),
      });
      expect(res.status).toBe("invalid_email");
      expect(res.template).toBeNull();
    }
    expect(client.signInWithOtp).not.toHaveBeenCalled();
  });

  it("logs a diagnostic when a send fails", async () => {
    const client = makeClient({
      signInWithOtp: vi.fn(async () => ({ error: { message: "boom", code: "unexpected_failure" } })),
    });
    await sendMagicLink(client, { ...base, attempts: emptyAttempts() });
    expect(console.error).toHaveBeenCalledWith(
      "[auth-email] send failed",
      expect.objectContaining({ template: "magiclink", code: "unexpected_failure" }),
    );
  });
});
