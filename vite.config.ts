import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      manifest: {
        name: "Tajweed Tutor AI",
        short_name: "Tajweed AI",
        description: "Améliore ta récitation du Coran avec un coach IA de tajwīd.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#16a34a",
        background_color: "#0d1117",
        orientation: "portrait",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-api-cache",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-audio-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Limite d'avertissement resserrée : chaque chunk doit rester léger
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) return "vendor-charts";
            if (id.includes("jszip") || id.includes("pako")) return "vendor-zip";
            if (id.includes("html2canvas")) return "vendor-html2canvas";
            if (id.includes("jspdf") || id.includes("qrcode")) return "vendor-pdf";
            if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) return "vendor-radix";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("date-fns")) return "vendor-date";
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "vendor-react";
            return "vendor";
          }
          // Chunk dédié à l'admin (route déjà lazy-loadée)
          if (id.includes("/src/pages/AdminDashboard") || id.includes("/src/components/admin/")) return "admin";
          if (id.includes("/src/i18n/")) return "app-i18n";
          if (id.includes("/src/content/")) return "app-content";
          if (id.includes("/src/data/")) return "app-data";
          return undefined;
        },
      },
    },
  },
}));
