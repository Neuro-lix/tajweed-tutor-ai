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
  } catch {}
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
  } catch {}
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
      .then((reg) => console.log("[SW] Registered:", reg.scope))
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}
