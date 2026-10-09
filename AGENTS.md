
- Acoustic tajweed checks (ghunna, qalqala, madd) live in supabase/functions/_shared/ as pure functions so they run server-side and are unit-tested; why: "Mesuré" must come from the signal, not the LLM.
- Dataset samples are stored only on explicit user opt-in, with a hashed contributor id; why: privacy and consent.
- Android app is built only in GitHub Actions (.github/workflows/android.yml): android/ is generated in CI, never committed; why: no Android toolchain in Lovable and a single reproducible signed build.
- Edge functions use supabase/functions/_shared/{cors,http,auth,rateLimit,credits,llmJson,hash}.ts (requireUser, atomic consume/refund credits, parseLlmJson, HMAC pseudonymize); why: one audited path for auth, CORS, credits and errors.
- Android-only behavior goes through src/lib/platform.ts (isNativeApp/isAndroidApp), never user-agent sniffing; purchase UI is hidden on Android; why: Google Play payments policy while keeping web unchanged.
- Front validates edge-function results with src/lib/analysisSchema.ts before use; why: never crash on a malformed AI response.
