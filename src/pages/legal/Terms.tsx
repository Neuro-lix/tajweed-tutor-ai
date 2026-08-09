import { LegalLayout, Section } from "./LegalLayout";

const Terms = () => (
  <LegalLayout
    title="Conditions générales d'utilisation et de vente"
    description="Conditions générales d'utilisation et de vente de Nassihah (Tajweed Tutor AI) : accès au service, crédits, paiements, responsabilités."
    path="/conditions-generales"
    updatedAt="9 août 2026"
  >
    <Section heading="1. Objet">
      <p>
        Nassihah (« Tajweed Tutor AI ») est un service en ligne d'aide à l'apprentissage de la
        récitation du Coran assistée par intelligence artificielle. Les présentes conditions
        régissent l'accès au service et l'achat de crédits.
      </p>
    </Section>
    <Section heading="2. Compte utilisateur">
      <p>
        La création d'un compte requiert une adresse e-mail valide. Vous êtes responsable de la
        confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
      </p>
    </Section>
    <Section heading="3. Crédits et tarification">
      <p>
        Le service fonctionne avec des crédits. Une analyse complète de récitation consomme
        1 crédit ; un message envoyé à l'assistant IA ou une génération audio consomme 0,1 crédit.
        Des crédits offerts sont accordés à l'inscription. Les crédits achetés n'ont pas de date
        d'expiration et ne sont pas convertibles en argent.
      </p>
    </Section>
    <Section heading="4. Paiements">
      <p>
        Les paiements sont traités par nos prestataires Paddle (Merchant of Record) et NOWPayments
        (paiements en cryptomonnaie). Les prix sont indiqués toutes taxes comprises lorsque la
        législation l'exige. Aucune donnée bancaire n'est stockée sur nos serveurs.
      </p>
    </Section>
    <Section heading="5. Utilisation acceptable">
      <p>
        Vous vous engagez à ne pas détourner le service (automatisation abusive, contournement des
        limites d'usage, rétro-ingénierie) ni à téléverser de contenu illicite. Tout abus peut
        entraîner la suspension du compte sans remboursement des crédits consommés.
      </p>
    </Section>
    <Section heading="6. Nature de l'analyse IA">
      <p>
        Les retours fournis par l'IA sont une aide pédagogique et ne remplacent pas l'enseignement
        d'un professeur qualifié ni la délivrance d'une ijāza par un maître certifié.
      </p>
    </Section>
    <Section heading="7. Disponibilité et responsabilité">
      <p>
        Le service est fourni « en l'état ». Nous mettons tout en œuvre pour assurer sa
        disponibilité, sans garantie d'absence d'interruption. Notre responsabilité est limitée au
        montant payé au cours des douze derniers mois.
      </p>
    </Section>
    <Section heading="8. Modification et droit applicable">
      <p>
        Les présentes conditions peuvent être modifiées ; la version en vigueur est celle publiée
        sur cette page. Elles sont soumises au droit français, sous réserve des dispositions
        impératives protectrices des consommateurs.
      </p>
    </Section>
    <Section heading="9. Contact">
      <p>
        Pour toute question : <a className="text-primary underline" href="/contact">page Contact</a>.
      </p>
    </Section>
  </LegalLayout>
);

export default Terms;