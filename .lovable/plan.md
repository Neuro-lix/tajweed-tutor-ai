## État actuel vs demande

Points de la demande qui ne s'appliquent pas tels quels :
- `src/pages/Index.tsx` n'est PAS corrompu (se termine bien à `export default Index;`).
- Aucun `clickCount` dans `AppHeader.tsx` — l'accès dev mode passe ailleurs (à confirmer ou ajouter).
- Pas de dossier `src/components/admin/` ni de `AdminDashboard.tsx` (la vue admin existe via `currentView === 'admin'` dans `src/pages/AdminDashboard.tsx`).
- `currentView` est un type `AppView` (union typée), pas un string libre — la migration vers routes nommées exige refactor de `useIndexState`.
- Pas de `react-helmet-async` installé.
- `.env` est listé dans la sandbox mais Lovable Cloud rotate déjà les clés ; pas besoin de `git rm --cached`.
- La clé anon Supabase est publique de design (ne pas paniquer ni "rotater" sur cette demande).

## Batch 1 — Sécurité backend (sans casser le front)

1. `analyze-recitation` & `chat-assistant` : remplacer `getClaims()` par `getUser()`, garder `verify_jwt = false` (signing-keys system) et valider en code.
2. `analyze-recitation` :
   - limite payload `audioBase64 > 5_000_000` → 413.
   - garantir 422 + `error: "transcription_empty"` quand whisper renvoie vide.
3. `chat-assistant` : sanitize messages (filter, slice 2000, max 50).
4. `crypto-webhook` & `paddle-webhook` : 503 si secret absent.
5. `verify-certificate` : rate-limit anon par IP via UUID dérivé SHA-256 (pas le zero-UUID).
6. CORS edge functions : restreindre à `ALLOWED_ORIGIN` (env), fallback `*` uniquement en dev — sinon casse le preview Lovable.
7. `nginx.conf` : ajouter X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, CSP.
8. `Dockerfile` : `USER appuser` non-root.

Livrable : déploiement edge functions, lint Supabase clean.

## Batch 2 — Bugs front réels

1. `AppHeader.tsx` : ajouter (s'il manque) compteur 7 clics logo + reset 3s → ouvre prompt dev mode. Ne PAS toucher si la logique est ailleurs (à vérifier dans `useIndexState`).
2. `RecitationInterface` ou hook d'appel : intercepter `error === "transcription_empty"` ou status 422 → toast "Voix non captée".
3. `data-testid="recitation-error-card"` sur l'Alert d'erreur ; `data-testid="certificate-title"` sur le titre du certificat dans `CertificateModal`/`SurahCertificate`.

## Batch 3 — Routes SPA + Diagnostics + Health

1. Routes nommées dans `App.tsx` : `/dashboard`, `/recitation`, `/boutique`, `/admin` → `<Index initialView="..." />` ; refactor `useIndexState` pour accepter `initialView` + sync `navigate()` au changement de vue.
2. Edge function `health` (publique, no-store, CORS *).
3. `Diagnostics.tsx` : bouton "Exporter le diagnostic JSON" (regs + caches + /api/health + UA).
4. `vite.config.ts` proxy `/api/health`.
5. Skip `react-helmet-async` (overkill ici) — utiliser `document.title` + `<link rel="canonical">` injecté via effet, OU installer la lib si tu insistes.

## Batch 4 — Admin LLM Credits + Tests Playwright

1. Migration `llm_usage` (table + RLS admin via `has_role`, pas `auth.jwt()->>'role'` qui n'existe pas ici).
2. `analyze-recitation` : insert fire-and-forget dans `llm_usage` après Gemini.
3. `src/pages/AdminDashboard.tsx` : ajouter onglet "💳 Crédits LLM" avec `LLMCreditsTab` (total mois, budget localStorage, alerte rouge, table 20 dernières lignes).
4. `tests/e2e/verifyCertificate.spec.ts` + update `playwright.config.ts` (video/screenshot retain-on-failure, trace).

## Hors scope explicite

- `git rm --cached .env` : non — le `.env` Lovable est géré et la clé anon est publique.
- Rotation manuelle de clés.
- Migration vers `react-helmet-async` (sauf demande explicite).
- Activation `verify_jwt = true` côté config.toml : Lovable utilise signing-keys → la validation reste **en code** via `getUser()`. Modifier config.toml peut casser les invocations (incompatible avec la convention Lovable).

## Validation à chaque batch

Après chaque batch : tu confirmes "OK batch suivant" avant que je passe au prochain. Si un batch échoue (lint/build), je corrige avant d'avancer.

Démarre Batch 1 ?
