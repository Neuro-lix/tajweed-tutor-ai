import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import { useLanguage } from '@/contexts/LanguageContext';
import logoImage from '@/logo.png';
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { PageSeo } from '@/components/seo/PageSeo';

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
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

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

  // Maps Supabase auth errors to clear, user-friendly messages
  const mapAuthError = (err: { message?: string; code?: string; status?: number }): string => {
    const code = err?.code ?? '';
    const msg = err?.message || '';
    if (code === 'weak_password' || /known to be weak|pwned/i.test(msg))
      return "Ce mot de passe apparaît dans des fuites de données connues. Choisis un mot de passe unique (évite les mots courants, prénoms, 123456…).";
    if (code === 'user_already_exists' || /already registered|already been registered/i.test(msg))
      return t.emailAlreadyUsed;
    if (code === 'over_email_send_rate_limit' || err?.status === 429 || /rate limit|too many/i.test(msg))
      return "Trop de tentatives. Patiente une minute puis réessaie.";
    if (code === 'email_address_invalid' || /invalid email/i.test(msg))
      return "Adresse email invalide. Vérifie l'orthographe.";
    if (code === 'signup_disabled')
      return "Les inscriptions sont temporairement désactivées.";
    if (/Invalid login credentials/i.test(msg)) return t.emailOrPasswordWrong;
    if (/Email not confirmed/i.test(msg))
      return "Ton email n'est pas encore confirmé. Ouvre le lien reçu par email.";
    if (/fetch|network/i.test(msg))
      return "Connexion au serveur impossible. Vérifie ta connexion internet et réessaie.";
    return msg || t.unexpectedError;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Countdown between two resend attempts (avoids hitting the auth rate limit).
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResendConfirmation = async () => {
    const target = signupEmail || email;
    if (!target || cooldown > 0) return;
    setResendState('sending');
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: target,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        setResendState('error');
        setResendMessage(mapAuthError(error));
      } else {
        setResendState('sent');
        setResendMessage(`Email renvoyé à ${target}. Pense à vérifier tes spams.`);
        setCooldown(60);
      }
    } catch {
      setResendState('error');
      setResendMessage(t.unexpectedError);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: t.loginErrorTitle,
          description: mapAuthError(error),
          variant: "destructive",
        });
      } else {
        toast({ title: t.welcomeBack, description: t.loginSuccessDesc });
      }
    } catch {
      toast({ title: t.error, description: t.unexpectedError, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast({ title: t.invalidPassword, description: t.passwordCriteria, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t.error, description: t.passwordsNoMatch, variant: "destructive" });
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
          title: t.error,
          description: mapAuthError(error),
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({ title: t.accountCreated, description: t.checkEmailConfirm });
      }
    } catch {
      toast({ title: t.error, description: t.unexpectedError, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: t.emailRequired, description: t.enterEmail, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) {
        toast({ title: t.error, description: mapAuthError(error), variant: "destructive" });
      } else {
        setForgotSent(true);
      }
    } catch {
      toast({ title: t.error, description: t.unexpectedError, variant: "destructive" });
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
      <PageSeo
        title="Connexion — Tajweed Tutor AI"
        description="Connecte-toi à Tajweed Tutor AI pour accéder à ton coach IA de récitation du Coran, tes progrès et tes analyses de tajwīd."
        path="/auth"
      />
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
            {view === 'login' ? t.loginTitle : view === 'signup' ? t.signupTitle : t.forgotPasswordTitle}
          </CardTitle>
          <CardDescription className="text-base">
            {view === 'login' ? t.accessLearning
              : view === 'signup' ? t.startJourney
              : t.resetPasswordDesc}
          </CardDescription>
        </CardHeader>

        <CardContent>

          {/* FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-medium">{t.emailSentTitle}</p>
                  <p className="text-sm text-muted-foreground">{t.checkMailReset}</p>
                  <Button variant="outline" className="w-full" onClick={() => { setView('login'); setForgotSent(false); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />{t.backToLogin}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.sendingButton}</> : t.sendLinkButton}
                  </Button>
                  <button type="button" onClick={() => setView('login')} className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" />{t.backToLogin}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.password}</Label>
                  <button type="button" onClick={() => setView('forgot')} className="text-xs text-primary hover:underline">
                    {t.forgotPassword}
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
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.loginTitle}...</> : t.connectButton}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView('signup')} className="text-sm text-primary hover:underline">
                  {t.noAccountSignup}
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fullNameLabel}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" type="text" placeholder={t.yourNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 pt-2">
                    <PasswordCheck valid={passwordChecks.minLength} label={t.minChars} />
                    <PasswordCheck valid={passwordChecks.hasUppercase} label={t.oneUppercase} />
                    <PasswordCheck valid={passwordChecks.hasLowercase} label={t.oneLowercase} />
                    <PasswordCheck valid={passwordChecks.hasNumber} label={t.oneDigit} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Astuce : utilise un mot de passe unique. Les mots de passe présents dans des fuites connues sont refusés.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPasswordLabel}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`pl-10 pr-10 ${confirmPassword.length > 0 ? passwordChecks.passwordsMatch ? 'border-green-500' : 'border-red-500' : ''}`} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordChecks.passwordsMatch && (
                  <p className="text-xs text-red-500">{t.passwordsNoMatch}</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmitSignup}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.creatingButton}</> : t.createAccount}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-sm text-primary hover:underline">
                  {t.alreadyHaveAccount}
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
