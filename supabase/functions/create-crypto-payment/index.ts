import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCatalogItem } from "../_shared/crypto-catalog.ts";

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
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
const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const ok = ALLOWLIST.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWLIST[0],
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authentification obligatoire : l'utilisateur est déduit du JWT,
    // jamais du corps de la requête.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    // ── Prix & libellé résolus depuis le catalogue serveur uniquement.
    const item = getCatalogItem(body?.productId);
    if (!item) {
      return new Response(JSON.stringify({ error: "Unknown product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!NOWPAYMENTS_API_KEY) throw new Error("NOWPAYMENTS_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    // ── Limite d'abus : 10 créations de facture par heure et par utilisateur.
    const sbAdmin = createClient(
      SUPABASE_URL!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rl } = await sbAdmin.rpc("check_and_increment_rate_limit", {
      p_user_id: userId,
      p_action: "create-crypto-payment",
      p_max: 10,
      p_window_seconds: 3600,
    });
    if (rl && (rl as { allowed?: boolean }).allowed === false) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use origin from request or fallback
    const origin = req.headers.get("origin") || "https://tajweedtutorai.com";

    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: item.price,
        price_currency: "eur",
        ipn_callback_url: `${SUPABASE_URL}/functions/v1/crypto-webhook`,
        success_url: `${origin}/shop/success?method=crypto`,
        cancel_url: `${origin}/shop`,
        order_description: item.name,
        // Use double underscore to preserve UUID integrity
        // Format: <userId>__<productId>__<timestamp>
        order_id: `${userId}__${item.id}__${Date.now()}`,
      }),
    });

    const invoice = await response.json();

    if (!response.ok) {
      throw new Error(invoice.message || "Failed to create invoice");
    }

    return new Response(
      JSON.stringify({
        invoiceUrl: invoice.invoice_url,
        invoiceId: invoice.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
