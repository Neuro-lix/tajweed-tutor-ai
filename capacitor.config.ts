import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Minimal Capacitor configuration — PREPARATION ONLY.
 *
 * Nothing native is built or published from here. To create the native
 * projects later, run locally (after `git pull` + `npm install`):
 *   npm run build
 *   npx cap add ios      # requires macOS + Xcode
 *   npx cap add android  # requires Android Studio
 *   npx cap sync
 *
 * The `ios/` and `android/` folders are intentionally NOT committed.
 *
 * ─── Web-only API audit (WebView compatibility notes) ────────────────────
 * Found while scanning `src/` — none of these break the build, but they
 * behave differently inside a Capacitor WebView and should be revisited
 * before shipping a native app:
 *
 *  • `window.print()` — src/pages/Index.tsx:207, src/components/reports/
 *    RecitationReport.tsx:87. No print dialog exists in a WebView; prefer the
 *    existing jsPDF export (`src/utils/pdfGenerator.ts`) + @capacitor/share.
 *  • `window.open(..., '_blank')` — src/pages/Shop.tsx, src/pages/ShopSuccess.tsx,
 *    src/pages/Boutique.tsx, src/pages/Ijaza.tsx, src/components/certificates/
 *    ShareCertificate.tsx. Opens inside the WebView (or is blocked); should use
 *    @capacitor/browser (`Browser.open`) for external URLs and payments.
 *  • `mailto:` links via window.open — src/pages/Ijaza.tsx, src/pages/Boutique.tsx.
 *    Needs the native mail intent instead.
 *  • `window.location.reload()` / `.replace()` — src/main.tsx:73,
 *    src/components/pwa/SwUpdateBanner.tsx, src/components/ErrorBoundary.tsx,
 *    src/components/admin/AdminPasswordGate.tsx, src/pages/Diagnostics.tsx.
 *    Service-worker update flows are irrelevant in a WebView; guard these with
 *    `Capacitor.isNativePlatform()`.
 *  • Service worker / PWA install prompt (`vite-plugin-pwa`,
 *    src/components/pwa/PwaInstallDialog.tsx) — inert on native; should be hidden.
 *  • `navigator.mediaDevices.getUserMedia` (audio recording) — works, but iOS
 *    requires `NSMicrophoneUsageDescription` in Info.plist.
 *  • OAuth redirects use `window.location.origin`, which is `capacitor://localhost`
 *    on iOS / `http://localhost` on Android — those origins must be added to the
 *    backend's redirect allowlist before native sign-in works.
 *
 * `localStorage` / `sessionStorage` usage is fine as-is.
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.dd06a15664f5407dbf7994ef3c169108',
  appName: 'recite-perfectly-bot',
  webDir: 'dist',
};

export default config;
