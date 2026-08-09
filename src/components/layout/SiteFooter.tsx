import { Link } from "react-router-dom";

const LINKS = [
  { to: "/contact", label: "Contact" },
  { to: "/conditions-generales", label: "Conditions générales" },
  { to: "/confidentialite", label: "Politique de confidentialité" },
  { to: "/remboursement", label: "Remboursement & annulation" },
  { to: "/tajwid", label: "Cours de Tajwīd" },
  { to: "/shop", label: "Boutique" },
];

export const SiteFooter = () => (
  <footer className="border-t border-border bg-card/40 mt-16">
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4 items-center text-center">
      <nav aria-label="Liens de bas de page" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nassihah — Tajweed Tutor AI. Tous droits réservés.
      </p>
    </div>
  </footer>
);

export default SiteFooter;