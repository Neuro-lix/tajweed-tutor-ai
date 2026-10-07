const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://tajweedtutorai.com")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Native app (Capacitor) and Lovable preview origins are always allowed in addition to ALLOWED_ORIGINS.
const BUILTIN = ["https://localhost", "http://localhost", "capacitor://localhost"];

function isAllowed(origin: string): boolean {
  if (BUILTIN.includes(origin) || /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com)$/i.test(origin)) return true;
  return ALLOWED.some((a) =>
    a.startsWith("*.") ? origin.endsWith(a.slice(1)) && origin.startsWith("https://") : a === origin
  );
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": isAllowed(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function handleOptions(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: corsHeaders(req) }) : null;
}
