import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, productName, productType, userId } = await req.json();

    const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!NOWPAYMENTS_API_KEY) throw new Error("NOWPAYMENTS_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: "eur",
        ipn_callback_url: `${SUPABASE_URL}/functions/v1/crypto-webhook`,
        success_url: `https://tajweedtutorai.com/shop/success?pack=${productType || ""}&method=crypto`,
        cancel_url: "https://tajweedtutorai.com/shop",
        order_description: productName,
        order_id: `${userId}-${Date.now()}`,
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
