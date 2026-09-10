import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseHealthCard } from '@/components/diagnostics/SupabaseHealthCard';

const SW_VERSION_KEY = 'app_sw_version';
const BUILD_KEY = 'app_build_marker';

export default function Diagnostics() {
  const [swVersion, setSwVersion] = useState<string>('');
  const [buildMarker, setBuildMarker] = useState<string>('');
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

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

  /** PDF récapitulatif du diagnostic, généré et téléchargé depuis l'app. */
  const exportDiagnosticsPdf = async () => {
    setPdfBusy(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 20;
      const line = (text: string, size = 10, bold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        for (const chunk of doc.splitTextToSize(text, 170) as string[]) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(chunk, 20, y);
          y += size * 0.55 + 3;
        }
      };

      line('Diagnostic Nassihah', 18, true);
      line(new Date().toLocaleString('fr-FR'), 10);
      y += 4;

      line('Environnement', 13, true);
      line(`URL base de donnees : ${import.meta.env.VITE_SUPABASE_URL ? 'configuree' : 'manquante'}`);
      line(`Cle publique : ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'configuree' : 'manquante'}`);
      line(`Identifiant projet : ${import.meta.env.VITE_SUPABASE_PROJECT_ID ? 'configure' : 'manquant'}`);
      y += 4;

      line('Application', 13, true);
      line(`Version du service worker : ${localStorage.getItem(SW_VERSION_KEY) || 'inconnue'}`);
      line(`Marqueur de build : ${localStorage.getItem(BUILD_KEY) || 'inconnu'}`);
      line(`Enregistrements service worker : ${registrations}`);
      line(`Caches (${cacheNames.length}) : ${cacheNames.join(', ') || 'aucun'}`);
      y += 4;

      line('Connexion et e-mails', 13, true);
      try {
        const { error: dbError } = await supabase.from('sheikhs').select('id').limit(1);
        line(`Acces base de donnees : ${dbError ? 'echec - ' + dbError.message : 'OK'}`);
      } catch {
        line('Acces base de donnees : echec');
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        line(`Service de connexion : OK (${session ? 'session active' : 'aucune session'})`);
      } catch {
        line('Service de connexion : echec');
      }
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-email-hook/health`,
        );
        const health = await res.json();
        const templates: string[] = health?.templates ?? [];
        line(`Domaine expediteur : ${health?.senderDomain ?? 'inconnu'}`);
        line(`Modeles e-mail deployes : ${templates.join(', ') || 'aucun'}`);
        line(`Lien magique : ${templates.includes('magiclink') ? 'configure' : 'absent'}`);
        line(`Mot de passe oublie : ${templates.includes('recovery') ? 'configure' : 'absent'}`);
      } catch {
        line('Service e-mail : injoignable');
      }

      doc.save(`diagnostic-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setPdfBusy(false);
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

      // Server-side diagnostics (certificate/recitation errors) come from the
      // diagnostics-export endpoint, which returns a stable JSON schema.
      let server: unknown = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase.functions.invoke('diagnostics-export');
          if (error) throw error;
          server = data;
        }
      } catch (e) {
        console.warn('[Diagnostics] Could not load server diagnostics', e);
      }

      const payload = {
        generatedAt: new Date().toISOString(),
        swVersion: localStorage.getItem(SW_VERSION_KEY) || 'unknown',
        buildMarker: localStorage.getItem(BUILD_KEY) || 'unknown',
        userAgent: navigator.userAgent,
        caches: cacheNames,
        serviceWorkerRegistrations: registrations,
        healthcheckErrors,
        server,
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
        <SupabaseHealthCard />
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