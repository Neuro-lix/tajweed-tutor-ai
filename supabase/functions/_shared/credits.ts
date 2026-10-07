import { supabaseAdmin } from "./auth.ts";
import { HttpError } from "./http.ts";

export async function consumeCredits(userId: string, amount: number): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("consume_credits", { p_user_id: userId, p_amount: amount });
  if (error) { console.error("[credits]", error); throw new HttpError(500, "Erreur interne."); }
  if (typeof data !== "number" || data < 0) throw new HttpError(402, "Crédits insuffisants.");
  return data;
}

export async function refundCredits(userId: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("refund_credits", { p_user_id: userId, p_amount: amount });
  if (error) console.error("[credits:refund]", error);
}
