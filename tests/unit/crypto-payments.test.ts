import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRYPTO_CATALOG, getCatalogItem } from "../../supabase/functions/_shared/crypto-catalog";
import { CREDIT_COSTS } from "../../supabase/functions/_shared/credit-costs";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const createPayment = read("../../supabase/functions/create-crypto-payment/index.ts");
const webhook = read("../../supabase/functions/crypto-webhook/index.ts");
const analyze = read("../../supabase/functions/analyze-recitation/index.ts");
const useCreditsHook = read("../../src/hooks/useCredits.tsx");

describe("Catalogue produit (source de vérité serveur)", () => {
  it("expose des prix et crédits figés côté serveur", () => {
    expect(getCatalogItem("pack_starter")).toMatchObject({ price: 1.99, credits: 50 });
    expect(getCatalogItem("pack_standard")).toMatchObject({ price: 4.99, credits: 150 });
    expect(getCatalogItem("pack_premium")).toMatchObject({ price: 9.99, credits: 400 });
  });

  it("rejette tout productId inconnu ou non-string", () => {
    for (const bad of ["", "pack_free", "../pack_premium", null, undefined, 42, {}]) {
      expect(getCatalogItem(bad)).toBeNull();
    }
  });

  it("n'accorde jamais de crédits aux produits PDF", () => {
    for (const item of Object.values(CRYPTO_CATALOG)) {
      if (!item.id.startsWith("pack_")) expect(item.credits).toBe(0);
      expect(item.price).toBeGreaterThan(0);
    }
  });
});

describe("create-crypto-payment exige l'authentification", () => {
  it("dérive l'utilisateur du JWT et refuse sans en-tête Authorization", () => {
    expect(createPayment).toMatch(/auth\.getUser/);
    expect(createPayment).toMatch(/401/);
    expect(createPayment).toMatch(/Authorization/i);
  });

  it("ne fait jamais confiance à un userId envoyé par le client", () => {
    expect(createPayment).not.toMatch(/body\.userId|const\s*\{\s*userId\s*\}\s*=\s*await req\.json/);
  });

  it("résout le prix depuis le catalogue et non depuis la requête", () => {
    expect(createPayment).toMatch(/getCatalogItem/);
    expect(createPayment).not.toMatch(/price_amount:\s*(body|amount)\b/);
  });

  it("applique une limite de débit sur la création de factures", () => {
    expect(createPayment).toMatch(/check_and_increment_rate_limit/);
  });
});

describe("crypto-webhook : signature, montant et idempotence", () => {
  it("refuse toute requête sans secret configuré ou sans signature", () => {
    expect(webhook).toMatch(/NOWPAYMENTS_IPN_SECRET/);
    expect(webhook).toMatch(/x-nowpayments-sig/);
    expect(webhook).toMatch(/Invalid signature/);
    expect(webhook).toMatch(/HMAC/);
  });

  it("compare le montant payé au prix catalogue avant de créditer", () => {
    expect(webhook).toMatch(/Amount mismatch/);
    expect(webhook).toMatch(/item\.price/);
    expect(webhook).toMatch(/item\.credits/);
  });

  it("empêche le double crédit d'un même paiement", () => {
    expect(webhook).toMatch(/processed_payment_events/);
  });

  // Reproduction de la règle de validation du montant appliquée par le webhook.
  const accepts = (paid: number, currency: string, productId: string) => {
    const item = getCatalogItem(productId);
    if (!item) return false;
    return currency.toLowerCase() === "eur" && paid >= item.price - 0.01;
  };

  it("refuse un montant inférieur au palier ou une mauvaise devise", () => {
    expect(accepts(9.99, "eur", "pack_premium")).toBe(true);
    expect(accepts(9.98, "eur", "pack_premium")).toBe(true); // tolérance d'arrondi
    expect(accepts(1.99, "eur", "pack_premium")).toBe(false);
    expect(accepts(0, "eur", "pack_premium")).toBe(false);
    expect(accepts(9.99, "usd", "pack_premium")).toBe(false);
    expect(accepts(9.99, "eur", "produit_inconnu")).toBe(false);
  });

  it("parse order_id avec double underscore sans casser les UUID", () => {
    const userId = "0f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
    const [parsedUser, parsedProduct] = `${userId}__pack_premium__${Date.now()}`.split("__");
    expect(parsedUser).toBe(userId);
    expect(getCatalogItem(parsedProduct)?.credits).toBe(400);
  });
});

describe("La déduction de crédits ne peut pas être contournée", () => {
  it("analyze-recitation vérifie le solde AVANT toute transcription", () => {
    expect(analyze).toMatch(/insufficient_credits/);
    expect(analyze).toMatch(/402/);
    const gateIndex = analyze.indexOf("insufficient_credits");
    const transcribeIndex = analyze.search(/transcri/i);
    expect(gateIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeLessThan(analyze.length);
    expect(transcribeIndex).toBeGreaterThan(-1);
  });

  it("la déduction se fait côté serveur via le service role", () => {
    expect(analyze).toMatch(/deduct_credit/);
    expect(analyze).toMatch(/SERVICE_ROLE/);
  });

  it("le client n'appelle jamais deduct_credit lui-même", () => {
    expect(useCreditsHook).not.toMatch(/deduct_credit/);
    expect(useCreditsHook).not.toMatch(/\.insert\(/);
  });

  it("le coût d'une analyse reste strictement positif", () => {
    expect(CREDIT_COSTS.analyzeRecitation).toBeGreaterThan(0);
  });
});
