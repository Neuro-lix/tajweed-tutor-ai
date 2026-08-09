/**
 * Pure helpers for the Paddle webhook IP allowlist.
 *
 * Kept dependency-free (no Deno APIs) so they can be unit-tested with vitest
 * from the main project — see tests/unit/paddle-webhook.test.ts.
 */

/** Parse Paddle's published IP payload into a normalised set of IPv4 strings. */
export function parsePaddleIps(json: unknown): Set<string> {
  const j = (json ?? {}) as Record<string, unknown>;
  const data = (j.data ?? {}) as Record<string, unknown>;
  const list =
    (data.ipv4_addresses as string[] | undefined) ??
    (j.ipv4_addresses as string[] | undefined) ??
    (Array.isArray(j.data) ? (j.data as string[]) : undefined) ??
    [];
  return new Set(
    list.map((ip) => String(ip).trim().split("/")[0]).filter(Boolean),
  );
}

/** Extract the originating client IP from proxy headers. */
export function clientIpFrom(headers: {
  get(name: string): string | null;
}): string {
  const fwd = headers.get("x-forwarded-for") ?? "";
  return (fwd.split(",")[0] || headers.get("x-real-ip") || "").trim();
}

/**
 * Allowlist decision. An empty/unknown IP is NEVER allowed when a list exists.
 * A `null` list means the list could not be fetched — the caller then falls
 * back to signature-only verification.
 */
export function isIpAllowed(ip: string, allowed: Set<string> | null): boolean {
  if (allowed === null) return true; // list unavailable → signature-only path
  if (!ip) return false;
  return allowed.has(ip);
}
