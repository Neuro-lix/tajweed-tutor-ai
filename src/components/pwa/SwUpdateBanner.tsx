import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function SwUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleWaiting = (sw: ServiceWorker) => {
      setWaitingWorker(sw);
      setShowBanner(true);
    };

    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        if (reg.waiting) {
          handleWaiting(reg.waiting);
          return;
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleWaiting(newWorker);
            }
          });
        });
      } catch (e) {
        console.warn('[SwUpdateBanner] check failed', e);
      }
    };

    checkForUpdate();
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    setTimeout(() => window.location.reload(), 300);
  };

  if (!showBanner) return null;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: '#16a34a',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          fontFamily: 'sans-serif',
          fontSize: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          maxWidth: '90vw',
          animation: 'sw-slideUp .3s ease-out',
        }}
      >
        <RefreshCw size={16} />
        <span>Nouvelle version disponible</span>
        <button
          onClick={handleUpdate}
          style={{
            background: '#fff',
            color: '#16a34a',
            border: 0,
            padding: '6px 12px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Mettre à jour
        </button>
        <button
          onClick={() => setShowBanner(false)}
          aria-label="Fermer"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <style>{`@keyframes sw-slideUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
      }`}</style>
    </>
  );
}