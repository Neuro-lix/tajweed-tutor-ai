import { HttpError } from "./http.ts";

export function parseLlmJson<T = unknown>(raw: string): T {
  let s = (raw ?? "").trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\x60{3}\s*$/, "");
  const start = s.indexOf("{"), end = s.lastIndexOf("}");
  if (start === -1 || end <= start) throw new HttpError(502, "Réponse de l'IA illisible.");
  s = s.slice(start, end + 1);
  try { return JSON.parse(s) as T; } catch { throw new HttpError(502, "Réponse de l'IA illisible."); }
}
