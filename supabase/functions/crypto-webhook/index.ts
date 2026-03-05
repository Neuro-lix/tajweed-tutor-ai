import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    const payload = await req.json();
    console.log("[crypto-webhook] Received:", JSON.stringify(payload));

    if (payload.payment_status === "finished" || payload.payment_status === "confirmed") {
      const orderId = payload.order_id as string;
      const userId = orderId.split("-")[0];
      const description = payload.order_description || "";

      let creditsToAdd = 0;
      if (description.includes("Starter")) creditsToAdd = 50;
      else if (description.includes("Standard")) creditsToAdd = 150;
      else if (description.includes("Premium")) creditsToAdd = 400;

      if (creditsToAdd > 0 && userId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

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
