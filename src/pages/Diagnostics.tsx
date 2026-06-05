import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SW_VERSION_KEY = 'app_sw_version';
const BUILD_KEY = 'app_build_marker';

export default function Diagnostics() {
  const [swVersion, setSwVersion] = useState<string>('');
  const [buildMarker, setBuildMarker] = useState<string>('');
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const refresh = async () => {
    setSwVersion(localStorage.getItem(SW_VERSION_KEY) || 'unknown');
    setBuildMarker(localStorage.getItem(BUILD_KEY) || 'unknown');
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        setCacheNames(names);
      } catch {
        setCacheNames([]);
      }
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      setRegistrations(regs.length);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const hardReload = async () => {
    setBusy(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      localStorage.removeItem(SW_VERSION_KEY);
      localStorage.removeItem(BUILD_KEY);
    } finally {
      window.location.replace('/?sw-cleanup=' + Date.now());
    }
  };

  const exportDiagnostics = async () => {
    setExporting(true);
    try {
      let healthcheckErrors: unknown[] = [];
      try {
        healthcheckErrors = JSON.parse(localStorage.getItem('healthcheck_errors') || '[]');
      } catch {
        healthcheckErrors = [];
      }

      let corrections: unknown[] = [];
      let certificates: unknown[] = [];
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [corrRes, certRes] = await Promise.all([
            supabase
              .from('corrections')
              .select('id, surah_number, verse_number, word, rule_type, rule_description, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(200),
            supabase
              .from('user_certificates')
              .select('id, surah_number, qiraat, average_score, certificate_type, completed_at')
              .eq('user_id', user.id)
              .order('completed_at', { ascending: false })
              .limit(200),
          ]);
          corrections = corrRes.data ?? [];
          certificates = certRes.data ?? [];
        }
      } catch (e) {
        console.warn('[Diagnostics] Could not load certificate/recitation errors', e);
      }

      const payload = {
        generatedAt: new Date().toISOString(),
        swVersion: localStorage.getItem(SW_VERSION_KEY) || 'unknown',
        buildMarker: localStorage.getItem(BUILD_KEY) || 'unknown',
        userAgent: navigator.userAgent,
        caches: cacheNames,
        serviceWorkerRegistrations: registrations,
        healthcheckErrors,
        recitationErrors: corrections,
        certificates,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Diagnostics</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Worker / Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div data-testid="sw-version">SW_VERSION: {swVersion}</div>
            <div data-testid="build-marker">build marker: {buildMarker}</div>
            <div data-testid="sw-registrations">registrations: {registrations}</div>
            <div>
              <div className="mb-1">caches ({cacheNames.length}):</div>
              <ul className="list-disc pl-6" data-testid="cache-list">
                {cacheNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
                {cacheNames.length === 0 && <li className="text-muted-foreground">aucun</li>}
              </ul>
            </div>
            <div className="flex gap-2 pt-3">
              <Button onClick={refresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" /> Rafraîchir
              </Button>
              <Button onClick={exportDiagnostics} variant="outline" size="sm" disabled={exporting} data-testid="export-diagnostics">
                <Download className="w-4 h-4 mr-1" /> Exporter JSON
              </Button>
              <Button onClick={hardReload} variant="destructive" size="sm" disabled={busy}>
                <Trash2 className="w-4 h-4 mr-1" /> Hard reload
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Le hard reload désinscrit le Service Worker, vide les caches, puis recharge l'application.
        </p>
      </div>
    </div>
  );
}