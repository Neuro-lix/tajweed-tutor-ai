import { supabaseAdmin } from "./auth.ts";
import { HttpError } from "./http.ts";

export async function enforceRateLimit(userId: string, key: string, max: number, windowSeconds: number) {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_user_id: userId, p_key: key, p_max: max, p_window_seconds: windowSeconds,
  });
  if (error) { console.error("[rateLimit]", error); throw new HttpError(500, "Erreur interne."); }
  if (data !== true) throw new HttpError(429, "Trop de requêtes, patiente une minute.");
}
