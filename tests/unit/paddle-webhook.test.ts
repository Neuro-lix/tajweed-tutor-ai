import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  clientIpFrom,
  isIpAllowed,
  parsePaddleIps,
} from "../../supabase/functions/paddle-webhook/ipAllowlist";

const source = readFileSync(
  new URL("../../supabase/functions/paddle-webhook/index.ts", import.meta.url),
  "utf8",
);

const headers = (h: Record<string, string>) => ({
  get: (name: string) => h[name.toLowerCase()] ?? null,
});

describe("Paddle IP allowlist", () => {
  const paddlePayload = {
    data: { ipv4_addresses: ["34.194.127.46", "54.234.237.108", "3.208.120.145/32"] },
  };

  it("parses Paddle's published IPv4 list and strips CIDR suffixes", () => {
    const ips = parsePaddleIps(paddlePayload);
    expect(ips.has("34.194.127.46")).toBe(true);
    expect(ips.has("3.208.120.145")).toBe(true);
    expect(ips.size).toBe(3);
  });

  it("tolerates the flat array shape", () => {
    expect(parsePaddleIps({ ipv4_addresses: ["1.2.3.4"] }).has("1.2.3.4")).toBe(true);
    expect(parsePaddleIps({ data: ["1.2.3.4"] }).has("1.2.3.4")).toBe(true);
  });

  it("accepts traffic coming from a listed Paddle IP", () => {
    const ips = parsePaddleIps(paddlePayload);
    expect(isIpAllowed("34.194.127.46", ips)).toBe(true);
  });

  it("REJECTS traffic from any IP outside the list", () => {
    const ips = parsePaddleIps(paddlePayload);
    for (const rogue of ["1.1.1.1", "34.194.127.47", "192.168.0.1", "127.0.0.1"]) {
      expect(isIpAllowed(rogue, ips)).toBe(false);
    }
  });

  it("REJECTS requests with no resolvable client IP", () => {
    const ips = parsePaddleIps(paddlePayload);
    expect(isIpAllowed("", ips)).toBe(false);
  });

  it("falls back to signature-only when the list could not be fetched", () => {
    expect(isIpAllowed("1.1.1.1", null)).toBe(true);
  });

  it("reads the first hop of x-forwarded-for", () => {
    expect(clientIpFrom(headers({ "x-forwarded-for": "34.194.127.46, 10.0.0.1" })))
      .toBe("34.194.127.46");
    expect(clientIpFrom(headers({ "x-real-ip": "54.234.237.108" })))
      .toBe("54.234.237.108");
    expect(clientIpFrom(headers({}))).toBe("");
  });
});

describe("Paddle webhook invariants (source contract)", () => {
  it("stores paddle_customer_id on profiles keyed by user_id, never by id", () => {
    expect(source).toContain('.update({ paddle_customer_id: String(paddleCustomerId) })');
    // The auth user id lives in profiles.user_id — matching on `id` updates 0 rows.
    expect(source).toMatch(/paddle_customer_id[\s\S]{0,200}\.eq\("user_id", userId\)/);
    expect(source).not.toMatch(/paddle_customer_id[\s\S]{0,200}\.eq\("id", userId\)/);
  });

  it("rejects non-Paddle IPs before doing any work", () => {
    expect(source).toMatch(/Rejected request from non-Paddle IP/);
    expect(source).toMatch(/status: 403/);
  });

  it("refuses unsigned or badly signed webhooks", () => {
    expect(source).toContain("PADDLE_WEBHOOK_SECRET");
    expect(source).toMatch(/Invalid signature/);
  });

  it("is idempotent via processed_payment_events", () => {
    expect(source).toContain("processed_payment_events");
  });
});
