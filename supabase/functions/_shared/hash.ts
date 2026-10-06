const encoder = new TextEncoder();

/** HMAC-SHA256 avec un secret serveur : un hash non salé d'un user id est réversible par force brute. */
export async function pseudonymize(value: string): Promise<string> {
  const secret = Deno.env.get("DATASET_HASH_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("DATASET_HASH_SECRET missing or too short");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
