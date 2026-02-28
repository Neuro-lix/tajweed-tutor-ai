import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import logoImage from '@/assets/logo.png';
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase && passwordChecks.hasNumber;
  const canSubmitSignup = isPasswordValid && passwordChecks.passwordsMatch && email && fullName;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) navigate('/');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message.includes('Invalid login credentials')
            ? "Email ou mot de passe incorrect."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Bienvenue !", description: "Connexion réussie." });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast({ title: "Mot de passe invalide", description: "Le mot de passe ne respecte pas les critères.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });
      if (error) {
        toast({
          title: "Erreur",
          description: error.message.includes('already registered')
            ? "Cet email est déjà utilisé. Essayez de vous connecter."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Compte créé !", description: "Vérifiez vos emails pour confirmer votre compte." });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email requis", description: "Entrez votre adresse email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setForgotSent(true);
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-600' : 'text-muted-foreground'}`}>
      {valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10"><Star8Point size={100} className="text-primary" /></div>
        <div className="absolute bottom-10 right-10"><Star8Point size={150} className="text-gold-warm" /></div>
      </div>

      <Card variant="elevated" className="w-full max-w-md relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Tajweed Tutor AI" className="h-24 w-24 object-contain rounded-2xl" />
          </div>
          <CardTitle className="text-3xl font-amiri">
            {view === 'login' ? 'Connexion' : view === 'signup' ? 'Inscription' : 'Mot de passe oublié'}
          </CardTitle>
          <CardDescription className="text-base">
            {view === 'login' ? "Accédez à votre parcours d'apprentissage"
              : view === 'signup' ? 'Commencez votre voyage avec le Coran'
              : 'Réinitialisez votre mot de passe'}
          </CardDescription>
        </CardHeader>

        <CardContent>

          {/* FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-medium">Email envoyé !</p>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => { setView('login'); setForgotSent(false); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />Retour à la connexion
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : 'Envoyer le lien'}
                  </Button>
                  <button type="button" onClick={() => setView('login')} className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" />Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          )}

          {/* LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <button type="button" onClick={() => setView('forgot')} className="text-xs text-primary hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</> : 'Se connecter'}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView('signup')} className="text-sm text-primary hover:underline">
                  Pas encore de compte ? S'inscrire
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" type="text" placeholder="Votre nom" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 pt-2">
                    <PasswordCheck valid={passwordChecks.minLength} label="8 caractères min" />
                    <PasswordCheck valid={passwordChecks.hasUppercase} label="1 majuscule" />
                    <PasswordCheck valid={passwordChecks.hasLowercase} label="1 minuscule" />
                    <PasswordCheck valid={passwordChecks.hasNumber} label="1 chiffre" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`pl-10 pr-10 ${confirmPassword.length > 0 ? passwordChecks.passwordsMatch ? 'border-green-500' : 'border-red-500' : ''}`} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordChecks.passwordsMatch && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmitSignup}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer mon compte'}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-sm text-primary hover:underline">
                  Déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
