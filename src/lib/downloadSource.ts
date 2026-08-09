// Bundle every text source file at build time via Vite's import.meta.glob.
// Lazy (non-eager) so the raw sources land in their own chunks instead of
// bloating the admin bundle; they are only fetched when the ZIP is generated.
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
  { query: "?raw", import: "default" },
) as Record<string, () => Promise<string>>;

export async function downloadFullSourceZip(): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const [path, load] of Object.entries(files)) {
    let content = "";
    try {
      content = await load();
    } catch {
      // Unreadable/binary asset — keep the archive complete with an empty file.
    }
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