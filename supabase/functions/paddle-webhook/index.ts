import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS: env-driven allowlist (no wildcard). Paddle posts server-to-server
// without an Origin, so this mainly matters for any browser preflight. ───
const DEFAULT_ALLOWED_ORIGINS = [
  "https://recite-perfectly-bot.lovable.app",
  "https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app",
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

// Map Paddle price IDs to credit amounts
// Update these when you create your Paddle products
const PRICE_TO_CREDITS: Record<string, { credits: number; label: string }> = {
  // Hourly plan: grant 20 credits per hour purchased
  pri_PLACEHOLDER_HOURLY: { credits: 20, label: "Achat horaire Paddle" },
  // Unlimited monthly subscription: grant unlimited flag or large credit amount
  pri_PLACEHOLDER_UNLIMITED: { credits: 9999, label: "Abonnement illimité Paddle" },
};

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    if (
      event.event_type === "transaction.completed" ||
      event.event_type === "transaction.paid"
    ) {
      const transaction = event.data;
      const customData = transaction.custom_data || {};
      const userId = customData.user_id;

      if (!userId) {
        console.error("[paddle-webhook] No user_id in custom_data");
        return new Response("Missing user_id", { status: 400, headers: corsHeaders });
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

        const { data, error } = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_amount: totalCredits,
          p_description: description,
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
