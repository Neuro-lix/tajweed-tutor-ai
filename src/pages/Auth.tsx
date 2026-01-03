import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erreur de connexion",
              description: "Email ou mot de passe incorrect.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "Bienvenue !",
          description: "Connexion réussie.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Compte existant",
              description: "Cet email est déjà utilisé. Essayez de vous connecter.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "Compte créé !",
          description: "Bienvenue dans votre parcours coranique.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10">
          <Star8Point size={100} className="text-primary" />
        </div>
        <div className="absolute bottom-10 right-10">
          <Star8Point size={150} className="text-gold-warm" />
        </div>
      </div>

      <Card variant="elevated" className="w-full max-w-md relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Star8Point size={48} className="text-primary" />
          </div>
          <CardTitle className="text-3xl font-amiri">
            {isLogin ? 'Connexion' : 'Inscription'}
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin 
              ? 'Accédez à votre parcours d\'apprentissage' 
              : 'Commencez votre voyage avec le Coran'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Votre nom"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                isLogin ? 'Se connecter' : 'Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? "Pas encore de compte ? S'inscrire" 
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
