import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PageSeo } from "@/components/seo/PageSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Contact = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || message.trim().length < 10) {
      toast.error("Merci de remplir tous les champs (message d'au moins 10 caractères).");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;
      setSent(true);
      setSubject("");
      setMessage("");
      toast.success("Message envoyé. Nous vous répondons sous 48 h.");
    } catch (err) {
      console.error("[contact] submit failed", err);
      toast.error("L'envoi a échoué. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Contact | Nassihah — Tajweed Tutor AI"
        description="Contactez l'équipe Nassihah : questions sur les crédits, la facturation, l'ijāza ou un problème technique. Réponse sous 48 heures."
        path="/contact"
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-amiri font-bold text-foreground mb-2">Nous contacter</h1>
        <p className="text-muted-foreground mb-8">
          Une question sur votre compte, vos crédits, un paiement ou le tajwīd ? Écrivez-nous.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Card className="p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <a href="mailto:contact@tajweedtutorai.com" className="text-sm text-muted-foreground hover:text-primary">
                contact@tajweedtutorai.com
              </a>
            </div>
          </Card>
          <Card className="p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Délai de réponse</p>
              <p className="text-sm text-muted-foreground">Sous 48 heures ouvrées</p>
            </div>
          </Card>
          <Card className="p-4 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Facturation</p>
              <p className="text-sm text-muted-foreground">
                Voir la{" "}
                <Link to="/remboursement" className="hover:text-primary underline">
                  politique de remboursement
                </Link>
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-lg font-medium">Merci, votre message est bien parti ✅</p>
              <p className="text-sm text-muted-foreground">
                Nous vous répondons à {email} sous 48 heures.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-sm font-medium">Nom</label>
                  <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="text-sm font-medium">E-mail</label>
                  <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="text-sm font-medium">Sujet</label>
                <Input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
                <Textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={3000} required />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Envoyer le message
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Contact;