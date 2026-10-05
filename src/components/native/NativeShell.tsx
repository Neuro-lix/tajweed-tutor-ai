import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAndroidApp, isNativeApp } from '@/lib/platform';

/** Redirects purchase routes to home inside the Android app; renders children on web. */
export const WebOnly = ({ children }: { children: JSX.Element }) =>
  isAndroidApp() ? <Navigate to="/" replace /> : children;

/** Android back button + offline screen. Renders nothing on web. */
export const NativeShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('backButton', () => {
          if (window.location.pathname === '/' || window.location.pathname === '/dashboard') App.exitApp();
          else navigate(-1);
        }),
      )
      .then((h) => { remove = () => h.remove(); })
      .catch(() => { /* plugin unavailable */ });
    return () => remove?.();
  }, [navigate]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [location.pathname]);

  if (!isNativeApp() || online) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold text-foreground">Pas de connexion</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Vérifie ta connexion Internet. L'application se reconnectera automatiquement.
      </p>
      <Button onClick={() => setOnline(navigator.onLine)}>Réessayer</Button>
    </div>
  );
};
