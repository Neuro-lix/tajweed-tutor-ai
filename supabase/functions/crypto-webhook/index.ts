import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCatalogItem } from "../_shared/crypto-catalog.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    const bodyText = await req.text();

    // Verify HMAC signature from NOWPayments — secret is MANDATORY
    const signature = req.headers.get("x-nowpayments-sig");
    const IPN_SECRET = Deno.env.get("NOWPAYMENTS_IPN_SECRET");

    if (!IPN_SECRET) {
      console.error("[crypto-webhook] FATAL: NOWPAYMENTS_IPN_SECRET not set");
      return new Response("Service misconfigured", { status: 503 });
    }
    if (!signature) {
      console.error("[crypto-webhook] Missing signature header");
      return new Response("Unauthorized", { status: 401 });
    }

    {
      const parsed = JSON.parse(bodyText);
      const sortedBody = JSON.stringify(parsed, Object.keys(parsed).sort());
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(IPN_SECRET),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(sortedBody));
      const expectedSig = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature !== expectedSig) {
        console.error("[crypto-webhook] Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const payload = JSON.parse(bodyText);
    console.log("[crypto-webhook] Received:", JSON.stringify(payload));

    if (payload.payment_status === "finished") {
      const orderId = String(payload.order_id ?? "");
      // Use double underscore as separator to preserve UUID (which contains dashes)
      // Format: <userId>__<productId>__<timestamp>
      const parts = orderId.split("__");
      const userId = parts[0];
      const productId = parts[1] ?? "";

      if (!userId || userId.length < 32) {
        console.error("[crypto-webhook] Invalid userId from order_id:", orderId);
        return new Response("Invalid order", { status: 400 });
      }

      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // ── Le produit (prix + crédits) vient du catalogue serveur ou de la
      // commande enregistrée, jamais de la description libre du fournisseur.
      let item: { id: string; name: string; price: number; credits: number } | null = null;
      let orderRowId: string | null = null;

      if (productId.startsWith("order:")) {
        orderRowId = productId.slice("order:".length);
        const { data: order } = await admin
          .from("crypto_orders")
          .select("id, user_id, total_amount, total_credits, status")
          .eq("id", orderRowId)
          .maybeSingle();
        if (!order || order.user_id !== userId) {
          console.error("[crypto-webhook] Unknown order:", orderId);
          return new Response("OK", { status: 200 });
        }
        item = {
          id: `order:${order.id}`,
          name: "Panier Nassihah",
          price: Number(order.total_amount),
          credits: Number(order.total_credits),
        };
      } else {
        item = getCatalogItem(productId);
      }

      if (!item) {
        console.error("[crypto-webhook] Unknown product in order_id:", orderId);
        return new Response("OK", { status: 200 });
      }

      // ── Le montant réellement payé doit correspondre au prix du palier
      // (petite tolérance pour les arrondis de conversion).
      const paidAmount = Number(
        payload.price_amount ?? payload.pay_amount ?? payload.actually_paid ?? 0,
      );
      const paidCurrency = String(payload.price_currency ?? "eur").toLowerCase();
      if (paidCurrency !== "eur" || !(paidAmount >= item.price - 0.01)) {
        console.error(
          `[crypto-webhook] Amount mismatch for ${item.id}: paid ${paidAmount} ${paidCurrency}, expected ${item.price} eur`,
        );
        return new Response("Amount mismatch", { status: 400 });
      }

      const creditsToAdd = item.credits;

      if (creditsToAdd > 0) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Idempotence: refuse to credit the same payment twice
        const paymentId = String(payload.payment_id ?? payload.id ?? "");
        if (!paymentId) {
          console.error("[crypto-webhook] Missing payment id, skipping credit");
          return new Response("Invalid payload", { status: 400 });
        }

        const { error: dedupeError } = await supabase
          .from("processed_payment_events")
          .insert({ provider: "nowpayments", external_id: paymentId });

        if (dedupeError) {
          console.log(`[crypto-webhook] Payment ${paymentId} already processed, skipping`);
          return new Response("OK", { status: 200 });
        }

        const { error } = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_amount: creditsToAdd,
          p_description: `Achat crypto: ${item.name}`,
        });

        if (error) {
          console.error("[crypto-webhook] Error adding credits:", error);
        } else {
          console.log(`[crypto-webhook] Added ${creditsToAdd} credits to ${userId}`);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[crypto-webhook] Error:", error);
    return new Response("Error", { status: 500 });
  }
});
