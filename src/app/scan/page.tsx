// src/app/scan/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, VideoOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { activatePremiumWithCard } from '@/lib/actions';


export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };

    getCameraPermission();
    
     // Nettoyage : arrêter la caméra quand le composant est démonté
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleScan = async () => {
    if (!hasCameraPermission) {
        toast({ variant: 'destructive', title: 'Caméra non disponible' });
        return;
    }
     if (!user) {
        toast({ variant: 'destructive', title: 'Connexion requise', description: 'Veuillez vous connecter avant de scanner.' });
        router.push('/login');
        return;
    }
    
    setScanStatus('scanning');
    toast({
        title: 'Scan en cours...',
        description: 'Veuillez placer le QR code de votre carte devant la caméra.'
    });

    // --- SIMULATION ---
    setTimeout(async () => {
      try {
        // Dans une vraie app, on lirait les données du QR code ici.
        // Pour la simulation, on active directement le compte de l'utilisateur connecté.
        const result = await activatePremiumWithCard({ userId: user.uid });

        if (result.success) {
          setScanStatus('success');
          toast({
            title: 'Abonnement Activé !',
            description: `Bienvenue ! Votre abonnement premium est maintenant actif.`,
            className: 'bg-green-500 text-white'
          });
          // Rediriger vers la bibliothèque ou le tableau de bord
          setTimeout(() => {
            router.push('/library');
          }, 1500);
        } else {
            throw new Error(result.error);
        }
      } catch(error: any) {
          setScanStatus('error');
          toast({
              variant: 'destructive',
              title: 'Erreur d\'activation',
              description: error.message || 'Une erreur est survenue lors de l\'activation de votre carte.'
          })
      }
    }, 3000);
  };

  const renderContent = () => {
    if (authLoading || hasCameraPermission === null) {
      return <Loader2 className="h-10 w-10 animate-spin text-primary" />;
    }
    if (hasCameraPermission === false) {
      return (
         <Alert variant="destructive">
            <VideoOff className="h-4 w-4" />
            <AlertTitle>Caméra inaccessible</AlertTitle>
            <AlertDescription>
                Nous n'avons pas pu accéder à votre caméra. Veuillez vérifier les autorisations de votre navigateur et rafraîchir la page.
            </AlertDescription>
        </Alert>
      );
    }
    
     if (scanStatus === 'success') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Activation Réussie !</h3>
            <p className="text-muted-foreground">Redirection vers votre bibliothèque...</p>
        </div>
      )
    }

    if (scanStatus === 'error') {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <Alert variant="destructive">
                    <AlertTitle>Échec de l'Activation</AlertTitle>
                    <AlertDescription>
                        Nous n'avons pas pu activer votre abonnement. Veuillez réessayer.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => setScanStatus('idle')}>Réessayer</Button>
            </div>
        )
    }


    return (
       <>
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {scanStatus === 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <Loader2 className="h-10 w-10 animate-spin text-white mb-4" />
                    <p className="text-white font-semibold">Recherche du QR code...</p>
                </div>
            )}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-[250px] aspect-square border-4 border-white/50 rounded-lg shadow-lg" />
        </div>
        <Button onClick={handleScan} disabled={scanStatus === 'scanning' || authLoading} className="w-full">
            {scanStatus === 'scanning' ? 'Scan en cours...' : 'Démarrer le scan'}
        </Button>
       </>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
       <div className="absolute top-8 left-8">
            <Button asChild variant="outline">
                <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4"/>Retour</Link>
            </Button>
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Scanner votre Carte d'Abonnement</CardTitle>
          <CardDescription>
            Positionnez le QR code de votre carte face à la caméra pour vous connecter et activer votre abonnement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex justify-center items-center min-h-[200px]">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

