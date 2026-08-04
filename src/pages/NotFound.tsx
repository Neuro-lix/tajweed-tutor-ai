import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { resolveRedirect } from "@/lib/redirects";

const SUGGESTIONS = [
  { to: "/", label: "Accueil" },
  { to: "/tajwid", label: "Règles du tajwīd" },
  { to: "/noorani-qaida", label: "Noorani Qaida" },
  { to: "/ijaza", label: "Ijāza" },
  { to: "/shop", label: "Boutique" },
];

const NotFound = () => {
  const location = useLocation();
  const redirectTo = resolveRedirect(location.pathname);

  useEffect(() => {
    if (!redirectTo) {
      console.warn("404: route introuvable →", location.pathname);
    }
  }, [location.pathname, redirectTo]);

  // Legacy / malformed URL → canonical route (replace = redirect-like)
  if (redirectTo && redirectTo !== location.pathname) {
    return <Navigate to={`${redirectTo}${location.search}${location.hash}`} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Helmet>
        <title>Page introuvable (404) — Tajweed Tutor AI</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary mb-2">404</p>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">Cette page n’existe pas</h1>
        <p className="mb-6 text-muted-foreground">
          Le lien est peut-être obsolète ou mal écrit. Voici les pages les plus utiles :
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <Button key={s.to} asChild variant="outline" size="sm">
              <Link to={s.to}>{s.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
