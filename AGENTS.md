
- Acoustic tajweed checks (ghunna, qalqala, madd) live in supabase/functions/_shared/ as pure functions so they run server-side and are unit-tested; why: "Mesuré" must come from the signal, not the LLM.
- Dataset samples are stored only on explicit user opt-in, with a hashed contributor id; why: privacy and consent.
- Android app is built only in GitHub Actions (.github/workflows/android.yml): android/ is generated in CI, never committed; why: no Android toolchain in Lovable and a single reproducible signed build.
