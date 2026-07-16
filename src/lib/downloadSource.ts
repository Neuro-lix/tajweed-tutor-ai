import JSZip from "jszip";

// Bundle every text source file at build time via Vite's import.meta.glob.
// `as: "raw"` inlines the file contents as strings.
const files = import.meta.glob(
  [
    "/src/**/*",
    "/supabase/**/*",
    "/public/**/*",
    "/index.html",
    "/package.json",
    "/tsconfig*.json",
    "/vite.config.ts",
    "/tailwind.config.ts",
    "/postcss.config.js",
    "/components.json",
    "/eslint.config.js",
    "/README.md",
    "/Dockerfile",
    "/nginx.conf",
    "/.env.example",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

export async function downloadFullSourceZip(): Promise<void> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    // strip leading slash so the zip has a clean root
    zip.file(path.replace(/^\//, ""), content ?? "");
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `tajweed-tutor-source-${ts}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getBundledFileCount(): number {
  return Object.keys(files).length;
}