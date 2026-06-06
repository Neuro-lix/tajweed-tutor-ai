import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const APP_VERSION = "1.0.0";

/**
 * Returns the authenticated user's certificate/recitation diagnostics as a
 * stable, machine-readable JSON payload (server-side equivalent of the
 * client-side "Export JSON" download).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  const baseHeaders = { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId };

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized", request_id: requestId }), {
        status: 401,
        headers: baseHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized", request_id: requestId }), {
        status: 401,
        headers: baseHeaders,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [corrRes, certRes, sessRes] = await Promise.all([
      admin
        .from("corrections")
        .select("id, surah_number, verse_number, word, rule_type, rule_description, is_resolved, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("user_certificates")
        .select("id, surah_number, qiraat, average_score, certificate_type, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(200),
      admin
        .from("recitation_sessions")
        .select("id, surah_number, start_verse, end_verse, accuracy_score, errors_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (corrRes.error || certRes.error || sessRes.error) {
      console.error(`[diagnostics-export] req=${requestId} query error`, {
        corr: corrRes.error,
        cert: certRes.error,
        sess: sessRes.error,
      });
      return new Response(JSON.stringify({ error: "query_failed", request_id: requestId }), {
        status: 500,
        headers: baseHeaders,
      });
    }

    const payload = {
      schemaVersion: 1,
      appVersion: APP_VERSION,
      generatedAt: new Date().toISOString(),
      requestId,
      userId: user.id,
      counts: {
        recitationErrors: corrRes.data?.length ?? 0,
        certificates: certRes.data?.length ?? 0,
        sessions: sessRes.data?.length ?? 0,
      },
      recitationErrors: corrRes.data ?? [],
      certificates: certRes.data ?? [],
      sessions: sessRes.data ?? [],
    };

    return new Response(JSON.stringify(payload), { status: 200, headers: baseHeaders });
  } catch (e) {
    console.error(`[diagnostics-export] req=${requestId} unexpected`, e);
    return new Response(JSON.stringify({ error: "internal", request_id: requestId }), {
      status: 500,
      headers: baseHeaders,
    });
  }
});