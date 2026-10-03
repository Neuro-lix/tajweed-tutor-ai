# Plan : base de récitations, latence minimale, règles mesurées

## Objectif
1. Chaque récitation analysée alimente une base d'entraînement (comme Tarteel), avec consentement.
2. Réduire au maximum le délai du suivi en direct.
3. Faire passer madd, ghunna, qalqala de « Déduit » à « Mesuré » par analyse physique du son, puis préparer des classifieurs entraînés sur les étiquettes des experts.

## Phase 1 — Base de récitations (dataset)
- Case de consentement explicite « Contribuer à améliorer l'IA » (désactivée par défaut, respect de la règle actuelle de suppression immédiate si refus).
- Pour chaque analyse consentie, on enregistre : audio WAV 16 kHz (stockage privé), sourate/verset, qirā'a, texte attendu, transcription Tarteel, timestamps mot à mot, mesures acoustiques, erreurs détectées, score, genre (pour séparation), langue d'interface. Aucune donnée nominative dans l'échantillon (identifiant anonymisé).
- Les récitations fautives sont conservées aussi : ce sont les plus précieuses.
- Espace admin « Annotation » : les experts écoutent un segment, valident/corrigent chaque erreur (règle, mot, gravité, makhraj, ṣifa). Ces étiquettes deviennent la vérité terrain.
- Export du dataset (format JSONL + audio) compatible Hugging Face pour réentraîner/affiner le modèle Whisper Coran plus tard.
- Tableau de bord : nombre d'heures, d'échantillons étiquetés, répartition par règle et par sourate.

## Phase 2 — Latence du suivi en direct
- Passer de morceaux de ~4 s à des morceaux de ~1,2 s avec chevauchement, envoyés en continu.
- Alignement local dans le navigateur : on connaît le verset attendu, donc on fait avancer le curseur mot par mot avec la détection d'activité vocale + énergie, sans attendre le serveur (réaction quasi immédiate).
- Le serveur (Tarteel) confirme/corrige ensuite en arrière-plan ; les mots passent de « en cours » à « validé » ou « erreur ».
- Garder l'endpoint Hugging Face « chaud » pendant une session de récitation (ping au démarrage de l'enregistrement) pour éviter le démarrage à froid.
- Mesure et affichage de la latence réelle dans la page admin ASR.
- Objectif réaliste : curseur < 300 ms, confirmation serveur ~1–1,5 s.

## Phase 3 — Règles mesurées (physique du son)
Calculs effectués dans le navigateur sur l'audio, segmenté grâce aux timestamps mot à mot :
- Madd : durée de la voyelle allongée mesurée, convertie en ḥarakāt selon le tempo propre du récitant (durée moyenne d'une voyelle courte). Comparée à la longueur exigée (2/4/6).
- Ghunna : énergie de basse fréquence nasale (~250–450 Hz) + atténuation des aigus + durée, sur nūn/mīm mushaddad, ikhfā', idghām avec ghunna.
- Qalqala : pic d'énergie bref (explosion) après une occlusion silencieuse, sur ق ط ب ج د avec sukūn.
- Chaque résultat affiche le badge « Mesuré » avec la valeur (ex. « 3,8 ḥarakāt / 4 attendues »). Les règles non couvertes restent « Déduit ».
- Tests unitaires sur sons synthétiques (durées, pics, bandes de fréquence connues).

## Phase 4 — Classifieurs (makhārij, ṣifāt)
- Extraction de caractéristiques par lettre : formants F1/F2/F3, MFCC, centre spectral, bruit de friction.
- Quand assez d'échantillons sont étiquetés par les experts (seuil affiché dans l'admin, ex. 200 par lettre), entraînement de petits classifieurs exportés pour tourner dans le navigateur.
- D'ici là, l'interface montre clairement que makhārij/ṣifāt sont « Déduit ».

## Ce qui dépend de toi
- Recruter les experts annotateurs (comptes avec rôle expert).
- Valider le texte de consentement (aspect juridique/RGPD).
- L'entraînement réel des classifieurs demande des données : il démarrera quand la base sera suffisante.

## Détails techniques
- Nouvelles tables : `recitation_samples`, `sample_annotations`, avec RLS + GRANT ; rôle `expert` ajouté à `app_role` ; bucket privé `recitation-dataset`.
- `analyze-recitation` écrit l'échantillon si consentement ; mesures acoustiques envoyées par le client (module `src/lib/acoustics/` : madd, ghunna via FFT par bande, qalqala via enveloppe d'énergie).
- Suivi live : `AudioWorklet` + VAD local + alignement séquentiel sur le texte attendu ; appels serveur en flux continu.
- Fonction d'export JSONL réservée aux admins.

## Note
Le fichier envoyé (remise fidélité + aide solidaire) est un sujet différent : je le traiterai dans un second temps si tu le souhaites.
