import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Global error capture for healthcheck/diagnostics
window.addEventListener("error", (e) => {
  try {
    const errors = JSON.parse(localStorage.getItem("healthcheck_errors") || "[]");
    errors.unshift({
      message: e.message,
      stack: e.error?.stack,
      time: new Date().toISOString(),
    });
    localStorage.setItem("healthcheck_errors", JSON.stringify(errors.slice(0, 5)));
  } catch { /* storage unavailable — ignore */ }
});
window.addEventListener("unhandledrejection", (e) => {
  try {
    const errors = JSON.parse(localStorage.getItem("healthcheck_errors") || "[]");
    errors.unshift({
      message: String(e.reason?.message || e.reason),
      stack: e.reason?.stack,
      time: new Date().toISOString(),
    });
    localStorage.setItem("healthcheck_errors", JSON.stringify(errors.slice(0, 5)));
  } catch { /* storage unavailable — ignore */ }
});

try {
createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
} catch (err) {
  console.error("[main] Fatal render error:", err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<div style="padding:24px;font-family:sans-serif;color:#fff;background:#0f172a;min-height:100vh"><h1>Erreur de démarrage</h1><p>' +
      String((err as Error)?.message || err) +
      '</p><button onclick="location.reload()" style="padding:8px 16px;margin-top:12px">Recharger</button></div>';
  }
}

// Register Service Worker for PWA
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
        // Notify user when a new SW version is waiting
        const notifyUpdate = () => {
          if (document.getElementById("sw-update-banner")) return;
          const banner = document.createElement("div");
          banner.id = "sw-update-banner";
          banner.style.cssText =
            "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:99999;" +
            "background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;" +
            "box-shadow:0 4px 16px rgba(0,0,0,.25);font-family:sans-serif;font-size:14px;" +
            "display:flex;gap:12px;align-items:center;max-width:90vw";
          banner.innerHTML =
            '<span>Nouvelle version disponible</span>' +
            '<button id="sw-update-btn" style="background:#fff;color:#16a34a;border:0;padding:6px 12px;border-radius:6px;font-weight:600;cursor:pointer">Recharger</button>' +
            '<button id="sw-dismiss-btn" style="background:transparent;color:#fff;border:0;cursor:pointer;opacity:.8">×</button>';
          document.body.appendChild(banner);
          document.getElementById("sw-update-btn")?.addEventListener("click", () => {
            window.location.reload();
          });
          document.getElementById("sw-dismiss-btn")?.addEventListener("click", () => banner.remove());
        };
        if (reg.waiting) notifyUpdate();
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
    // Auto-reload once when a new SW takes control (after user accepts above)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
    });
  });
}
