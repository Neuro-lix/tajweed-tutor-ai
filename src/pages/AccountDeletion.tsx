import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const AccountDeletion = () => (
  <main className="container mx-auto max-w-2xl px-4 py-12 space-y-6">
    <Helmet>
      <title>Suppression de compte — Tajweed Tutor AI</title>
      <meta name="description" content="Comment supprimer votre compte Tajweed Tutor AI et vos données." />
    </Helmet>
    <h1 className="text-3xl font-semibold text-foreground">Supprimer votre compte</h1>
    <section className="space-y-3 text-muted-foreground">
      <h2 className="text-xl font-medium text-foreground">Depuis l'application</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>Connectez-vous à votre compte.</li>
        <li>Ouvrez « Mes crédits » (votre solde en haut de l'écran).</li>
        <li>En bas de la page, appuyez sur « Supprimer mon compte ».</li>
        <li>Tapez SUPPRIMER pour confirmer.</li>
      </ol>
      <h2 className="text-xl font-medium text-foreground pt-2">Données supprimées</h2>
      <p>Compte, profil, récitations enregistrées, progression, corrections, objectifs Ḥifẓ, certificats, crédits et statistiques. La suppression est immédiate et définitive.</p>
      <h2 className="text-xl font-medium text-foreground pt-2">Données conservées</h2>
      <p>Les justificatifs de paiement sont conservés pendant la durée légale comptable. Les échantillons déjà versés au jeu de données (avec votre accord) sont pseudonymisés et ne sont plus reliés à vous.</p>
      <h2 className="text-xl font-medium text-foreground pt-2">Sans accès à l'application</h2>
      <p>Écrivez-nous via la page <Link to="/contact" className="text-primary underline">Contact</Link> depuis l'adresse e-mail de votre compte ; nous traitons la demande sous 30 jours.</p>
    </section>
  </main>
);

export default AccountDeletion;
