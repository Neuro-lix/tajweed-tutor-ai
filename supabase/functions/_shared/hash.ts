const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("DATASET_HASH_SECRET");
  if (!secret || secret.length < 32) throw new Error("DATASET_HASH_SECRET manquant ou trop court");
  keyPromise ??= crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return keyPromise;
}

export async function pseudonymize(userId: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(userId));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
