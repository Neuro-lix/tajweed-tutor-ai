import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Infinity, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

// Paddle product/price IDs — à configurer quand vous aurez votre compte Paddle
const PADDLE_PRODUCTS = {
  hourly: "pri_PLACEHOLDER_HOURLY",    // Remplacer par le vrai price ID Paddle
  unlimited: "pri_PLACEHOLDER_UNLIMITED", // Remplacer par le vrai price ID Paddle
};

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          successUrl?: string;
          customer?: { email?: string };
          customData?: Record<string, string>;
        }) => void;
      };
    };
  }
}

const isPlaceholder = (priceId: string) => priceId.startsWith("pri_PLACEHOLDER");
const HOURLY_UNAVAILABLE = isPlaceholder(PADDLE_PRODUCTS.hourly);
const UNLIMITED_UNAVAILABLE = isPlaceholder(PADDLE_PRODUCTS.unlimited);

interface PricingSectionProps {
  onBack?: () => void;
}

export const PricingSection = ({ onBack }: PricingSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  // Load Paddle.js script
  useEffect(() => {
    if (document.getElementById("paddle-js")) {
      setPaddleReady(!!window.Paddle);
      return;
    }
    const script = document.createElement("script");
    script.id = "paddle-js";
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      // Initialize Paddle with client-side token (publishable)
      // TODO: Replace with your real Paddle client-side token
      const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
      if (window.Paddle && clientToken) {
        // Use sandbox for dev, remove for production
        if (import.meta.env.DEV) {
          window.Paddle.Environment.set("sandbox");
        }
        window.Paddle.Initialize({ token: clientToken });
        setPaddleReady(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  const handleCheckout = (priceType: "hourly" | "unlimited") => {
    if (!paddleReady || !window.Paddle) {
      toast.error("Paddle n'est pas encore configuré. Veuillez réessayer plus tard.");
      return;
    }

    const priceId = PADDLE_PRODUCTS[priceType];
    if (isPlaceholder(priceId)) {
      toast.error("Les produits Paddle ne sont pas encore configurés.");
      return;
    }

    setLoading(priceType);
    try {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        successUrl: `${window.location.origin}/?payment=success`,
        ...(user?.email ? { customer: { email: user.email } } : {}),
        customData: user ? { user_id: user.id } : undefined,
      });
    } catch (error) {
      console.error("Paddle checkout error:", error);
      toast.error(t.error);
    } finally {
      // Paddle overlay handles its own loading state
      setTimeout(() => setLoading(null), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-amiri font-bold text-foreground mb-4">{t.pricingChooseFormula}</h1>
          <p className="text-muted-foreground text-lg">{t.pricingAccess}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Card variant="elevated" className="p-8 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10"><Clock className="w-6 h-6 text-primary" /></div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{t.pricingHourly}</h3>
                <p className="text-muted-foreground text-sm">{t.pricingFlexible}</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">3€</span>
              <span className="text-muted-foreground">{t.pricingPerHour}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[t.pricingHourFeature1, t.pricingHourFeature2, t.pricingHourFeature3, t.pricingHourFeature4].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground"><Check className="w-4 h-4 text-gold" />{feature}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => handleCheckout("hourly")} disabled={loading !== null}>
              {loading === "hourly" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.pricingBuyHour}
            </Button>
          </Card>
          <Card variant="elevated" className="p-8 relative border-gold/50">
            <Badge variant="gold" className="absolute -top-3 right-6">{t.pricingRecommended}</Badge>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gold/10"><Infinity className="w-6 h-6 text-gold" /></div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{t.pricingUnlimited}</h3>
                <p className="text-muted-foreground text-sm">{t.pricingMonthly}</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">29€</span>
              <span className="text-muted-foreground">{t.pricingPerMonth}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[t.pricingUnlimitedFeature1, t.pricingUnlimitedFeature2, t.pricingUnlimitedFeature3, t.pricingUnlimitedFeature4, t.pricingUnlimitedFeature5, t.pricingUnlimitedFeature6].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground"><Check className="w-4 h-4 text-gold" />{feature}</li>
              ))}
            </ul>
            <Button variant="gold" className="w-full" onClick={() => handleCheckout("unlimited")} disabled={loading !== null}>
              {loading === "unlimited" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.pricingSubscribe}
            </Button>
          </Card>
        </div>
        {onBack && (
          <div className="text-center mt-8"><Button variant="ghost" onClick={onBack}>{t.pricingBack}</Button></div>
        )}
        <p className="text-center text-muted-foreground text-sm mt-8">{t.pricingSecure}</p>
      </div>
    </div>
  );
};
