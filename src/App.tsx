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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TranslationProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PwaInstallDialog />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ijaza" element={<Ijaza />} />
                <Route path="/verify/:id" element={<VerifyCertificate />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </TranslationProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

