import { LegalLayout, Section } from "./LegalLayout";

const Refund = () => (
  <LegalLayout
    title="Politique de remboursement et d'annulation"
    description="Conditions de remboursement des crédits et d'annulation des abonnements Nassihah."
    path="/remboursement"
    updatedAt="9 août 2026"
  >
    <Section heading="1. Droit de rétractation">
      <p>
        Conformément au droit de la consommation, vous disposez de 14 jours après l'achat pour
        demander le remboursement d'un pack de crédits, à condition qu'aucun crédit acheté n'ait
        été consommé. Les crédits déjà utilisés correspondent à un service numérique exécuté et ne
        sont pas remboursables.
      </p>
    </Section>
    <Section heading="2. Achats de crédits">
      <p>
        Si une erreur technique de notre côté a consommé des crédits sans fournir d'analyse, ces
        crédits vous sont recrédités intégralement sur simple demande.
      </p>
    </Section>
    <Section heading="3. Abonnements">
      <p>
        Un abonnement peut être annulé à tout moment depuis votre espace client ou via notre page
        Contact. L'annulation prend effet à la fin de la période de facturation en cours ; aucune
        somme n'est prélevée ensuite. Les périodes déjà entamées ne sont pas remboursées au prorata.
      </p>
    </Section>
    <Section heading="4. Comment demander un remboursement">
      <p>
        Envoyez votre demande via la page Contact en indiquant l'adresse e-mail du compte et la
        référence de la transaction. Nous répondons sous 5 jours ouvrés ; le remboursement accepté
        est effectué sur le moyen de paiement d'origine sous 10 jours ouvrés.
      </p>
    </Section>
    <Section heading="5. Paiements en cryptomonnaie">
      <p>
        Les paiements en cryptomonnaie sont irréversibles. En cas de remboursement accepté, nous
        procédons par recrédit de crédits sur votre compte ou par virement de la contre-valeur en
        crypto, hors frais de réseau.
      </p>
    </Section>
  </LegalLayout>
);

export default Refund;