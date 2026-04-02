// src/app/subscribe/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Star, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function SubscribePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user || !userData) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Vous devez être connecté pour vous abonner.",
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'La création de la session de paiement a échoué.');
      }

      const { redirect_url } = await response.json();
      window.location.href = redirect_url;

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Échec de l'abonnement",
        description: error instanceof Error ? error.message : "Une erreur inconnue est survenue. Veuillez réessayer.",
      });
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    "Accès illimité à toutes les ressources de la bibliothèque.",
    "Utilisation complète de l'Assistant IA (Mode Approfondi, Mermaid).",
    "Génération de parcours d'apprentissage personnalisés par l'IA.",
    "Création de quiz illimités sur tous les sujets.",
    "Accès prioritaire aux nouvelles fonctionnalités.",
  ];

  if (userData?.role === 'premium_student' || userData?.role === 'admin') {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                    <CardTitle>Vous êtes déjà un membre Premium !</CardTitle>
                    <CardDescription>
                        Merci pour votre soutien. Vous avez déjà accès à toutes les fonctionnalités de NeoStud.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/library">Explorer la bibliothèque</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
     )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="absolute top-8 left-8">
            <Button asChild variant="outline">
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/>Retour à l'accueil</Link>
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <Star className="h-10 w-10 text-amber-500" />
                    <div>
                         <h1 className="text-3xl font-bold tracking-tight">Passez à NeoStud Premium</h1>
                         <p className="text-muted-foreground mt-1">Débloquez tout le potentiel de la plateforme.</p>
                    </div>
                </div>

                <Card className="bg-background/50">
                    <CardHeader><CardTitle>Vos Avantages Premium</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {premiumFeatures.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
            
             <Card className="shadow-2xl shadow-primary/10">
                <CardHeader>
                    <CardTitle>Abonnement Annuel</CardTitle>
                    <CardDescription>
                        Un seul paiement pour un accès complet pendant un an.
                    </CardDescription>
                    <div className="pt-4">
                        <span className="text-4xl font-bold">10$</span>
                        <span className="text-muted-foreground">/ an</span>
                    </div>
                </CardHeader>
                <CardContent>
                     <Alert>
                        <User className="h-4 w-4" />
                        <AlertTitle>Connecté en tant que</AlertTitle>
                        <AlertDescription>
                            {userData?.email || 'Veuillez vous connecter.'}
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button 
                        onClick={handleSubscribe} 
                        className="w-full" 
                        disabled={isLoading || !user}
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirection vers le paiement...
                            </>
                        ) : (
                           'Payer avec Lygos'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
