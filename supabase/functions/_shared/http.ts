import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  constructor(public status: number, public publicMessage: string) { super(publicMessage); }
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(req: Request, err: unknown): Response {
  if (err instanceof HttpError) return json(req, { error: err.publicMessage }, err.status);
  console.error("[unhandled]", err);
  return json(req, { error: "Erreur interne, réessaie plus tard." }, 500);
}

export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 15_000_000): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, "Fichier trop volumineux.");
  try { return await req.json() as T; } catch { throw new HttpError(400, "Requête invalide."); }
}
