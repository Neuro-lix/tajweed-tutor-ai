import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      const orderId = payload.order_id as string;
      // Use double underscore as separator to preserve UUID (which contains dashes)
      const parts = orderId.split("__");
      const userId = parts[0];
      const description = payload.order_description || "";

      if (!userId || userId.length < 32) {
        console.error("[crypto-webhook] Invalid userId from order_id:", orderId);
        return new Response("Invalid order", { status: 400 });
      }

      let creditsToAdd = 0;
      if (description.includes("Starter")) creditsToAdd = 50;
      else if (description.includes("Standard")) creditsToAdd = 150;
      else if (description.includes("Premium")) creditsToAdd = 400;

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
          p_description: `Achat crypto: ${description}`,
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
