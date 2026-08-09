import { LegalLayout, Section } from "./LegalLayout";

const Privacy = () => (
  <LegalLayout
    title="Politique de confidentialité"
    description="Comment Nassihah collecte, utilise et protège vos données personnelles et vos enregistrements audio."
    path="/confidentialite"
    updatedAt="9 août 2026"
  >
    <Section heading="1. Responsable du traitement">
      <p>
        Nassihah (Tajweed Tutor AI), joignable via la page Contact, est responsable du traitement
        des données décrites ci-dessous.
      </p>
    </Section>
    <Section heading="2. Données collectées">
      <p>
        Compte : adresse e-mail, identifiant utilisateur, préférences (langue, thème, qirā’a).
        Usage : historique de récitations, scores de tajwīd, statistiques d'apprentissage,
        consommation de crédits. Paiement : identifiants de transaction fournis par Paddle ou
        NOWPayments (aucune donnée bancaire n'est stockée chez nous).
      </p>
    </Section>
    <Section heading="3. Enregistrements audio">
      <p>
        Vos enregistrements sont transmis à nos prestataires d'IA uniquement pour produire la
        transcription et l'analyse tajwīd. Ils ne sont conservés que si vous activez explicitement
        l'option de sauvegarde ; sinon ils sont supprimés immédiatement après l'analyse. Vous
        pouvez supprimer un enregistrement sauvegardé à tout moment depuis votre journal.
      </p>
    </Section>
    <Section heading="4. Sous-traitants">
      <p>
        Hébergement et base de données : Supabase. Modèles d'IA : OpenAI et Google via la
        passerelle Lovable AI. Paiements : Paddle, NOWPayments. Ces prestataires n'utilisent pas
        vos données pour entraîner des modèles dans le cadre de notre usage.
      </p>
    </Section>
    <Section heading="5. Base légale et durée de conservation">
      <p>
        Le traitement repose sur l'exécution du contrat (fourniture du service) et sur votre
        consentement pour les enregistrements sauvegardés. Les données sont conservées tant que
        votre compte est actif, puis supprimées dans les 30 jours suivant sa clôture.
      </p>
    </Section>
    <Section heading="6. Vos droits">
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et
        d'opposition. Exercez-les via la page Contact ; une réponse vous sera apportée sous 30 jours.
      </p>
    </Section>
    <Section heading="7. Cookies">
      <p>
        Nous utilisons des cookies strictement nécessaires (session d'authentification) et, avec
        votre consentement recueilli via notre bandeau, des cookies de mesure d'audience.
      </p>
    </Section>
    <Section heading="8. Sécurité">
      <p>
        Les accès aux données sont protégés par le chiffrement en transit et des règles de sécurité
        au niveau de chaque ligne de la base (RLS) : un utilisateur ne peut accéder qu'à ses
        propres données.
      </p>
    </Section>
  </LegalLayout>
);

export default Privacy;