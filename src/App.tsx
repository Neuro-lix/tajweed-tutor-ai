import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { PwaInstallDialog } from "@/components/pwa/PwaInstallDialog";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Ijaza from "./pages/IjazaWrapper";
import VerifyCertificate from "./pages/VerifyCertificate";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import ShopSuccess from "./pages/ShopSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TranslationProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PwaInstallDialog />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ijaza" element={<Ijaza />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/success" element={<ProtectedRoute><ShopSuccess /></ProtectedRoute>} />
                <Route path="/verify/:id" element={<VerifyCertificate />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </TranslationProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
