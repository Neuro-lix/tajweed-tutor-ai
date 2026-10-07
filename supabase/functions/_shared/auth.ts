import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin: SupabaseClient = createClient(URL, SERVICE, { auth: { persistSession: false } });

export async function requireUser(req: Request): Promise<User> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) throw new HttpError(401, "Non authentifié.");
  const client = createClient(URL, ANON, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new HttpError(401, "Session invalide.");
  return data.user;
}
