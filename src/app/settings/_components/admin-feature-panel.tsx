// src/app/settings/_components/admin-feature-panel.tsx
'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FeatureFlags } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function AdminFeaturePanel() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'feature_flags'));
        const fetchedFlags = querySnapshot.docs.reduce((acc, doc) => {
          acc[doc.id as keyof FeatureFlags] = doc.data().isPremium;
          return acc;
        }, {} as FeatureFlags);
        setFlags(fetchedFlags);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les réglages des fonctionnalités.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlags();
  }, [toast]);

  const handleFlagChange = async (featureName: keyof FeatureFlags, value: boolean) => {
    if (!flags) return;
    
    const originalFlags = { ...flags };
    const updatedFlags = { ...flags, [featureName]: value };
    setFlags(updatedFlags);

    try {
      const featureDocRef = doc(db, 'feature_flags', featureName);
      await setDoc(featureDocRef, { isPremium: value });
      toast({
        title: 'Réglage mis à jour',
        description: `La fonctionnalité a été basculée en mode ${value ? 'Premium' : 'Gratuit'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le réglage.',
      });
      // Revert UI on error
      setFlags(originalFlags);
    }
  };

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
         <CardHeader>
            <CardTitle>Panneau d'Administration</CardTitle>
          </CardHeader>
        <CardContent className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!flags) {
    return null; // ou un message d'erreur
  }


  const featureLabels: Record<keyof FeatureFlags, string> = {
    isAssistantPremium: 'Assistant IA',
    isQuizPremium: 'Générateur de Quiz IA',
    isPathPremium: 'Générateur de Parcours IA',
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Panneau d'Administration</CardTitle>
        </div>
        <CardDescription>
          Activez le mode "Premium" pour chaque fonctionnalité. Cela restreindra l'accès aux seuls utilisateurs abonnés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(featureLabels) as Array<keyof FeatureFlags>).map((key) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor={`feature-${key}`} className="flex-grow cursor-pointer">
              {featureLabels[key] || key}
            </Label>
            <Switch
              id={`feature-${key}`}
              checked={flags[key] ?? false}
              onCheckedChange={(checked) => handleFlagChange(key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
