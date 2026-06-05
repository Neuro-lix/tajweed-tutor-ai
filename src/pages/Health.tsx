import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SW_VERSION_KEY = 'app_sw_version';
const BUILD_KEY = 'app_build_marker';
const APP_VERSION = '1.0.0';

interface HealthReport {
  status: 'ok' | 'degraded';
  appVersion: string;
  swVersion: string;
  buildMarker: string;
  timestamp: string;
  checks: {
    backend: 'up' | 'down' | 'checking';
    serviceWorker: 'active' | 'inactive' | 'unsupported';
  };
}

/**
 * Lightweight health/status page for uptime monitoring.
 * Renders a machine-readable JSON payload describing service status and version.
 */
export default function Health() {
  const [report, setReport] = useState<HealthReport>({
    status: 'ok',
    appVersion: APP_VERSION,
    swVersion: localStorage.getItem(SW_VERSION_KEY) || 'unknown',
    buildMarker: localStorage.getItem(BUILD_KEY) || 'unknown',
    timestamp: new Date().toISOString(),
    checks: { backend: 'checking', serviceWorker: 'unsupported' },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let backend: 'up' | 'down' = 'down';
      try {
        const { error } = await supabase.from('profiles').select('user_id').limit(1);
        backend = error ? 'down' : 'up';
      } catch {
        backend = 'down';
      }

      let serviceWorker: 'active' | 'inactive' | 'unsupported' = 'unsupported';
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          serviceWorker = regs.length > 0 ? 'active' : 'inactive';
        } catch {
          serviceWorker = 'inactive';
        }
      }

      if (cancelled) return;
      setReport(prev => ({
        ...prev,
        status: backend === 'up' ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: { backend, serviceWorker },
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background p-6 font-mono text-sm">
      <h1 className="sr-only">Service Health</h1>
      <pre data-testid="health-json" className="whitespace-pre-wrap break-words text-foreground">
        {JSON.stringify(report, null, 2)}
      </pre>
    </main>
  );
}