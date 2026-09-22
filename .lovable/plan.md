# Analyse complète + 6 chantiers

## Ce qui va déjà bien

- La boutique propose carte bancaire (Paddle), PayPal et crypto, avec un panier euros/crypto séparé.
- Les crédits sont versés automatiquement par les webhooks Paddle et crypto, avec protection anti-doublon.
- L'espace admin existe avec vue d'ensemble, utilisateurs, paiements, e-mails, analyses et crédits.
- Le référencement (titres, descriptions, liens de langue, plan du site) est en place pour français, anglais et arabe.
- L'application propose déjà 20 langues dans le sélecteur.

## Ce qui ne va pas

1. **Indonésien et malais incomplets** : seulement ~110 textes traduits sur ~415. Tout le reste s'affiche en français.
2. **Référencement absent en indonésien/malais** : les pages publiques Tajwīd n'existent qu'en fr/en/ar ; pas d'adresses `/id/...` ni `/ms/...`, pas de liens de langue, rien dans le plan du site.
3. **Paiement euros non instantané** : après un paiement carte, l'utilisateur attend le webhook ; rien ne confirme le crédit tout de suite.
4. **Pas de page d'analyses pour l'utilisateur** : seul l'admin voit la liste des analyses.
5. **Suivi des analyses admin** : pas de filtre par utilisateur (le bouton « Détails » vient d'être ajouté).
6. **Gestion des comptes impossible sans code** : l'onglet Utilisateurs est en lecture seule, aucun changement de rôle ni suppression.

## Ce que je ne peux pas faire

- **L'achat crypto réel** : il exige votre portefeuille et votre validation de paiement. Dès que vous l'aurez fait, je vérifie le suivi des paiements et le solde.

## Le travail proposé

### 1. Traduction complète indonésien et malais
Compléter les ~300 textes manquants dans chaque langue, avec une vérification automatique qu'aucune clé ne manque.

### 2. Référencement en indonésien et malais
- Ajouter `id` et `ms` aux langues des pages publiques Tajwīd (contenu des pages, FAQ, quiz).
- Nouvelles adresses `/id/tajwid`, `/ms/tajwid`, et leurs sous-pages.
- Liens de langue réciproques (hreflang) sur toutes les pages, y compris depuis fr/en/ar.
- Plan du site régénéré avec ces nouvelles adresses.
- Maillage interne : chaque page renvoie vers ses équivalents dans les autres langues.

### 3. Paiement euros instantané
Nouvelle fonction serveur `paddle-verify` : à la fin du paiement, l'application demande au serveur de vérifier la transaction directement auprès de Paddle et de créditer immédiatement, sans attendre le webhook. Le même verrou anti-doublon garantit qu'aucun crédit n'est versé deux fois si le webhook arrive ensuite. La page de remerciement affiche le nouveau solde tout de suite.

**Nécessaire de votre part** : une clé API Paddle (Developer Tools → Authentication, commence par `pdl_live_apikey_...`). Sans elle, je garde le fonctionnement actuel par webhook.

### 4. Page publique « Mes analyses »
Nouvelle page `/mes-analyses` accessible à tout utilisateur connecté : liste de ses analyses (date, sourate, score, crédits, statut) et page de détail `/mes-analyses/:id` partageable par lien. Chacun ne voit que les siennes.

### 5. Filtre utilisateur dans « Suivi des analyses »
Champ de recherche par nom ou identifiant, combiné aux filtres de statut existants, et export CSV respectant le filtre.

### 6. Onglet admin « Gestion des comptes »
- Liste des utilisateurs avec recherche, rôle, date d'inscription, crédits.
- Attribuer/retirer les rôles admin et modérateur.
- Ajuster les crédits d'un compte.
- Supprimer un compte (avec confirmation).
Tout passe par une fonction serveur protégée qui vérifie le rôle admin ; rien n'est décidé côté navigateur.

## Détails techniques

- Traductions : `src/i18n/translations.ts`, plus un test unitaire de complétude des clés.
- SEO : `src/content/tajweed.ts` (LOCALES, LOCALE_HREFLANG), `scripts/generate-sitemap.ts`, routes `/:lang/tajwid*` déjà présentes dans `App.tsx`.
- Paiement : nouvelle edge function `paddle-verify` (API Paddle `GET /transactions/{id}`), réutilise `processed_payment_events` pour l'idempotence et `add_credits`.
- Analyses utilisateur : lecture de `llm_usage` et `recitation_sessions` via les politiques RLS existantes (chacun lit ses lignes).
- Admin comptes : nouvelle edge function `admin-users` (service_role, `has_role` vérifié côté serveur) pour lister, changer les rôles, ajuster les crédits et supprimer.
- Vérification : typecheck, lint ciblé, tests unitaires, build de production.
