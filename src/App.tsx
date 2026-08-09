import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PwaInstallDialog } from "@/components/pwa/PwaInstallDialog";
import { SwUpdateBanner } from "@/components/pwa/SwUpdateBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";

// Lazy-load all routes for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Ijaza = lazy(() => import("./pages/IjazaWrapper"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopSuccess = lazy(() => import("./pages/ShopSuccess"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const Health = lazy(() => import("./pages/Health"));
const AdminRoute = lazy(() => import("./pages/AdminRoute"));
const MyLlmUsage = lazy(() => import("./pages/MyLlmUsage"));
const MyCredits = lazy(() => import("./pages/MyCredits"));
const HifzPlan = lazy(() => import("./pages/HifzPlan"));
const NooraniQaida = lazy(() => import("./pages/NooraniQaida"));
const TajwidHub = lazy(() => import("./pages/tajweed/TajwidHub"));
const TajwidTopic = lazy(() => import("./pages/tajweed/TajwidTopic"));
const TajwidFaq = lazy(() => import("./pages/tajweed/TajwidFaq"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Refund = lazy(() => import("./pages/legal/Refund"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background">
    <div className="border-b border-border bg-card/50 h-16" />
    <div className="container mx-auto px-4 py-8 space-y-4 max-w-4xl animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded" />
      <div className="h-4 w-2/3 bg-muted rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TranslationProvider>
          <BrowserRouter>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PwaInstallDialog />
                <SwUpdateBanner />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminRoute /></ProtectedRoute>} />
                    <Route path="/my-usage" element={<ProtectedRoute><MyLlmUsage /></ProtectedRoute>} />
                    <Route path="/my-credits" element={<ProtectedRoute><MyCredits /></ProtectedRoute>} />
                    <Route path="/hifz" element={<ProtectedRoute><HifzPlan /></ProtectedRoute>} />
                    <Route path="/ijaza" element={<Ijaza />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop/success" element={<ProtectedRoute><ShopSuccess /></ProtectedRoute>} />
                    <Route path="/verify/:id" element={<VerifyCertificate />} />
                    <Route path="/diagnostics" element={<Diagnostics />} />
                    <Route path="/health" element={<Health />} />
                    <Route path="/noorani-qaida" element={<NooraniQaida />} />
                    <Route path="/tajwid" element={<TajwidHub />} />
                    <Route path="/tajwid/faq" element={<TajwidFaq />} />
                    <Route path="/tajwid/:topic" element={<TajwidTopic />} />
                    <Route path="/:lang/tajwid" element={<TajwidHub />} />
                    <Route path="/:lang/tajwid/faq" element={<TajwidFaq />} />
                    <Route path="/:lang/tajwid/:topic" element={<TajwidTopic />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/conditions-generales" element={<Terms />} />
                    <Route path="/confidentialite" element={<Privacy />} />
                    <Route path="/remboursement" element={<Refund />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <SiteFooter />
                </Suspense>
              </TooltipProvider>
            </AuthProvider>
          </BrowserRouter>
        </TranslationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
