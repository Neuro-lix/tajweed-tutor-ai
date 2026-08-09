import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  "https://recite-perfectly-bot.lovable.app",
  "https://tajweedtutorai.com",
  "https://www.tajweedtutorai.com",
  "http://localhost:8080",
  "http://localhost:5173",
];
const ENV_ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = ENV_ALLOWED.length ? ENV_ALLOWED : DEFAULT_ALLOWED_ORIGINS;

function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const ok = ALLOWLIST.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWLIST[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const messageId = typeof body?.messageId === "string" ? body.messageId : "";
    if (!/^[0-9a-f-]{36}$/i.test(messageId)) {
      return new Response(JSON.stringify({ error: "messageId invalide" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // The row is already persisted by the Contact form (public INSERT policy).
    // We read it back with the service role because reads are admin-only.
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: msg, error } = await sbAdmin
      .from("contact_messages")
      .select("id, name, email, subject, message, created_at")
      .eq("id", messageId)
      .maybeSingle();

    if (error) throw error;
    if (!msg) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Email notification ────────────────────────────────────────────
    // ⚠️ MANUAL SETUP REQUIRED to actually send emails:
    //   1. Add the `RESEND_API_KEY` secret (https://resend.com/api-keys).
    //   2. Verify the sending domain (tajweedtutorai.com) in Resend: SPF + DKIM + DMARC.
    //   3. Optionally set `CONTACT_NOTIFY_TO` (recipient) and `CONTACT_NOTIFY_FROM` (verified sender).
    // Without RESEND_API_KEY the message is still safely stored in
    // `contact_messages` (readable from the admin dashboard) — we never invent a key.
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const to = Deno.env.get("CONTACT_NOTIFY_TO") ?? "contact@tajweedtutorai.com";
    const from = Deno.env.get("CONTACT_NOTIFY_FROM") ?? "Nassihah <contact@tajweedtutorai.com>";

    if (!RESEND_API_KEY) {
      console.warn(
        "[contact-notify] RESEND_API_KEY not configured — message stored in " +
        "contact_messages but no email sent. Configure the secret to enable notifications.",
      );
      return new Response(JSON.stringify({ stored: true, emailed: false, reason: "email_not_configured" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const html = `
      <h2>Nouveau message de contact</h2>
      <p><strong>De :</strong> ${escapeHtml(msg.name)} &lt;${escapeHtml(msg.email)}&gt;</p>
      <p><strong>Sujet :</strong> ${escapeHtml(msg.subject)}</p>
      <p><strong>Reçu le :</strong> ${new Date(msg.created_at).toLocaleString("fr-FR")}</p>
      <hr />
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(msg.message)}</pre>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: msg.email,
        subject: `[Contact] ${msg.subject}`,
        html,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      console.error("[contact-notify] Resend error:", resp.status, errTxt);
      return new Response(JSON.stringify({ stored: true, emailed: false, reason: `resend_${resp.status}` }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ stored: true, emailed: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[contact-notify] Fatal:", err);
    return new Response(JSON.stringify({ error: "unexpected_error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
