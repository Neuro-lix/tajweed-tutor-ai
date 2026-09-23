# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
.

## Secrets Edge Functions (Hugging Face)

Les fonctions `tajweed-asr-analyze` et `analyze-recitation` utilisent un secret
côté serveur, **pas** une variable `.env` frontend :

| Secret | Usage |
| --- | --- |
| `HUGGINGFACE_API_KEY` | Transcription ASR spécialisée Coran (`tarteel-ai/whisper-base-ar-quran`) |

Étapes exactes pour l'ajouter :

1. Ouvrir le **Dashboard Supabase** du projet.
2. **Project Settings → Edge Functions → Secrets**.
3. **Add new secret** : nom `HUGGINGFACE_API_KEY`, valeur = le jeton
   Hugging Face (commence par `hf_`).
4. Le jeton doit avoir la permission **« Make calls to Inference Providers »**
   (jeton *fine-grained* → section Inference), sinon l'API renvoie `403`.
5. Sauvegarder, puis redéployer les deux fonctions.

Au démarrage, chaque fonction journalise l'état du secret :
`STARTUP: secret HUGGINGFACE_API_KEY absent …` ou `STARTUP: HUGGINGFACE_API_KEY détectée.`
Sans le secret, `tajweed-asr-analyze` répond `503 asr_not_configured` et
`analyze-recitation` bascule automatiquement sur le pipeline LLM seul.

Secrets optionnels liés : `ENABLE_ASR_PIPELINE` (`true`/`false`),
`HF_ASR_MODEL`, `HF_ASR_ENDPOINT_URL`.

> ⚠️ La précision automatique ne remplace pas un professeur ou un cheikh
> habilité : elle assiste la révision, elle ne délivre pas d'ijāza.
