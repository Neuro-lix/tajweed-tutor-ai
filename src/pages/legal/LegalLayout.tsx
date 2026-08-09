import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string;
  updatedAt?: string;
  children: ReactNode;
}

export const LegalLayout = ({ title, description, path, updatedAt, children }: LegalLayoutProps) => (
  <div className="min-h-screen bg-background">
    <PageSeo title={`${title} | Nassihah`} description={description} path={path} />
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <h1 className="text-3xl font-amiri font-bold text-foreground mb-2">{title}</h1>
      {updatedAt && (
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {updatedAt}</p>
      )}
      <article className="prose-sm max-w-none space-y-6 text-foreground/90 leading-relaxed">
        {children}
      </article>
    </div>
  </div>
);

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);