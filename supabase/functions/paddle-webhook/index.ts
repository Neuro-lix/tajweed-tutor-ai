import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientIpFrom, isIpAllowed, parsePaddleIps } from "./ipAllowlist.ts";

// ─── CORS: env-driven allowlist (no wildcard). Paddle posts server-to-server
// without an Origin, so this mainly matters for any browser preflight. ───
const DEFAULT_ALLOWED_ORIGINS = [
  "https://recite-perfectly-bot.lovable.app",
  "https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app",
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paddle-signature",
    "Vary": "Origin",
  };
}

/**
 * Verify Paddle webhook signature (HMAC SHA-256)
 * See: https://developer.paddle.com/webhooks/signature-verification
 */
async function verifyPaddleSignature(
  signature: string,
  rawBody: string,
  secretKey: string
): Promise<boolean> {
  try {
    // Parse Paddle-Signature header: ts=TIMESTAMP;h1=HASH
    const parts: Record<string, string> = {};
    for (const part of signature.split(";")) {
      const [key, value] = part.split("=");
      if (key && value) parts[key] = value;
    }

    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    // Build signed payload: timestamp:rawBody
    const payload = `${ts}:${rawBody}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison
    if (expectedHex.length !== h1.length) return false;
    let result = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      result |= expectedHex.charCodeAt(i) ^ h1.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("[paddle-webhook] Signature verification error:", err);
    return false;
  }
}

// Map Paddle price IDs to credit amounts.
// Credit amounts mirror the packs listed in src/pages/Shop.tsx.
const PRICE_TO_CREDITS: Record<string, { credits: number; label: string }> = {
  // Pack Starter — 50 crédits / 1,99 €
  pri_01kzm74zem2gd72bsd3an0h1vw: { credits: 50, label: "Pack Starter (50 crédits)" },
  // Pack Standard — 150 crédits / 4,99 €
  pri_01kzm7exmw1w0apnysd76kgszh: { credits: 150, label: "Pack Standard (150 crédits)" },
  // Pack Premium — 400 crédits / 9,99 € (ID confirmé par l'utilisateur, 26 chars)
  pri_01kzm7m6rwbdfks53gns8sjq4e: { credits: 400, label: "Pack Premium (400 crédits)" },

  // Legacy placeholders kept for the hourly / unlimited plans (not yet created in Paddle)
  pri_PLACEHOLDER_HOURLY: { credits: 20, label: "Achat horaire Paddle" },
  pri_PLACEHOLDER_UNLIMITED: { credits: 9999, label: "Abonnement illimité Paddle" },
};

// ─── IP allowlist: only Paddle's published IPv4 addresses may post here ───
const PADDLE_IPS_URL = "https://api.paddle.com/ips";
const IP_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
let ipCache: { ips: Set<string>; fetchedAt: number } | null = null;

async function getPaddleIps(): Promise<Set<string> | null> {
  if (ipCache && Date.now() - ipCache.fetchedAt < IP_CACHE_TTL_MS) return ipCache.ips;
  try {
    const resp = await fetch(PADDLE_IPS_URL);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    const json = await resp.json();
    const ips = parsePaddleIps(json);
    if (ips.size === 0) throw new Error("empty list");
    ipCache = { ips, fetchedAt: Date.now() };
    return ips;
  } catch (err) {
    console.error("[paddle-webhook] Could not fetch Paddle IP list:", err);
    // Keep serving with the last known good list if we have one.
    return ipCache?.ips ?? null;
  }
}

function clientIp(req: Request): string {
  return clientIpFrom(req.headers);
}

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Reject anything that does not come from a published Paddle IP.
    const allowedIps = await getPaddleIps();
    const ip = clientIp(req);
    if (!isIpAllowed(ip, allowedIps)) {
      console.error(`[paddle-webhook] Rejected request from non-Paddle IP: ${ip || "unknown"}`);
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
    if (!allowedIps) {
      console.warn("[paddle-webhook] Paddle IP list unavailable — relying on signature only");
    }

    const rawBody = await req.text();
    const paddleSignature = req.headers.get("paddle-signature");
    const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET");

    // Secret is MANDATORY — refuse the request rather than silently accepting unsigned webhooks
    if (!PADDLE_WEBHOOK_SECRET) {
      console.error("[paddle-webhook] FATAL: PADDLE_WEBHOOK_SECRET not set");
      return new Response("Service misconfigured", { status: 503, headers: corsHeaders });
    }
    if (!paddleSignature) {
      console.error("[paddle-webhook] Missing Paddle-Signature header");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const isValid = await verifyPaddleSignature(paddleSignature, rawBody, PADDLE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("[paddle-webhook] Invalid signature");
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log("[paddle-webhook] Event type:", event.event_type);
    console.log("[paddle-webhook] Payload:", JSON.stringify(event.data, null, 2));

    // Handle completed transactions (one-time or first subscription payment)
    if (event.event_type === "transaction.completed") {
      const transaction = event.data;
      const customData = transaction.custom_data || {};
      const userId = customData.user_id;

      if (!userId) {
        console.error("[paddle-webhook] No user_id in custom_data");
        return new Response("Missing user_id", { status: 400, headers: corsHeaders });
      }

      // Mémorise l'identifiant client Paddle pour Retain (best-effort).
      const paddleCustomerId = transaction.customer_id;
      if (paddleCustomerId) {
        try {
          const sbAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );
          // INVARIANT: profiles.user_id is the auth user id (profiles.id is the row PK).
          // Matching on `id` here silently updated 0 rows — covered by
          // tests/unit/paddle-webhook.test.ts.
          const { error: profErr } = await sbAdmin
            .from("profiles")
            .update({ paddle_customer_id: String(paddleCustomerId) })
            .eq("user_id", userId);
          if (profErr) throw profErr;
        } catch (err) {
          console.error("[paddle-webhook] Could not store paddle_customer_id:", err);
        }
      }

      // Determine credits from line items
      let totalCredits = 0;
      let description = "Achat Paddle";
      const items = transaction.items || [];

      for (const item of items) {
        const priceId = item.price?.id;
        const mapping = priceId ? PRICE_TO_CREDITS[priceId] : null;
        if (mapping) {
          totalCredits += mapping.credits;
          description = mapping.label;
        }
      }

      // If no mapping found, try to determine from amount
      if (totalCredits === 0) {
        const totalAmount = parseFloat(transaction.details?.totals?.total || "0") / 100;
        if (totalAmount >= 29) {
          totalCredits = 9999;
          description = "Abonnement illimité Paddle";
        } else if (totalAmount >= 3) {
          totalCredits = 20;
          description = "Achat horaire Paddle";
        }
      }

      if (totalCredits > 0) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Idempotence: never credit the same Paddle transaction twice
        const transactionId = String(transaction.id ?? "");
        if (!transactionId) {
          console.error("[paddle-webhook] Missing transaction id");
          return new Response("Missing transaction id", { status: 400, headers: corsHeaders });
        }

        const { error: dedupeError } = await supabase
          .from("processed_payment_events")
          .insert({ provider: "paddle", external_id: transactionId });

        if (dedupeError) {
          console.log(`[paddle-webhook] Transaction ${transactionId} already processed, skipping`);
          return new Response(JSON.stringify({ received: true, deduped: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_amount: totalCredits,
          // On garde la référence Paddle dans la description : c'est le seul
          // endroit qui permet ensuite de rapprocher un crédit d'un paiement
          // (pas de table `payments` dédiée). Format parsé par src/lib/paymentsCsv.ts.
          p_description: `${description} [txn:${transactionId}]${
            transaction.invoice_number ? ` [achat:${transaction.invoice_number}]` : ""
          }`,
        });

        if (error) {
          console.error("[paddle-webhook] Error adding credits:", error);
          return new Response("Error adding credits", {
            status: 500,
            headers: corsHeaders,
          });
        }

        console.log(
          `[paddle-webhook] Added ${totalCredits} credits to ${userId}, new balance: ${data}`
        );
      }
    }

    // Handle subscription activated (recurring)
    if (event.event_type === "subscription.activated") {
      const subscription = event.data;
      const customData = subscription.custom_data || {};
      const userId = customData.user_id;

      if (userId) {
        console.log(
          `[paddle-webhook] Subscription activated for user ${userId}: ${subscription.id}`
        );
        // Credits are already added via transaction.completed
      }
    }

    // Handle subscription cancelled
    if (event.event_type === "subscription.canceled") {
      const subscription = event.data;
      const customData = subscription.custom_data || {};
      const userId = customData.user_id;

      if (userId) {
        console.log(
          `[paddle-webhook] Subscription canceled for user ${userId}: ${subscription.id}`
        );
        // Optionally: mark user as no longer subscribed
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[paddle-webhook] Error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
