// src/app/settings/page.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, KeyRound, Bell, Pencil, Loader2, Shield, Star, AlertTriangle, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db, storage } from '@/lib/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteCurrentUserAccount } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AdminFeaturePanel } from './_components/admin-feature-panel';

function SubscriptionPanel() {
  const { userData } = useAuth();
  
  const isPremium = userData?.role === 'premium_student' || userData?.role === 'admin';
  const subscriptionStartDate = userData?.subscriptionStartDate?.toDate ? userData.subscriptionStartDate.toDate().toLocaleDateString('fr-FR') : null;
  const subscriptionEndDate = userData?.subscriptionEndDate?.toDate ? userData.subscriptionEndDate.toDate().toLocaleDateString('fr-FR') : null;

  return (
     <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
            <div className='flex items-center gap-3'>
            <Star className="h-6 w-6 text-amber-500"/>
            <CardTitle>Mon Abonnement</CardTitle>
            </div>
            <CardDescription>Consultez les informations relatives à votre abonnement NeoStud.</CardDescription>
        </CardHeader>
        <CardContent>
            {isPremium ? (
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                    <p className="font-semibold text-green-800">Statut</p>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Premium Actif</Badge>
                </div>
                {subscriptionStartDate && (
                   <div className="flex items-center justify-between p-3 rounded-lg border">
                        <p className="text-muted-foreground">Date de début</p>
                        <p className="font-medium">{subscriptionStartDate}</p>
                    </div>
                )}
                {subscriptionEndDate && (
                   <div className="flex items-center justify-between p-3 rounded-lg border">
                        <p className="text-muted-foreground">Date d'expiration de la carte</p>
                        <p className="font-medium">{subscriptionEndDate}</p>
                    </div>
                )}
              </div>
            ) : (
                <div className="text-center p-4 border rounded-lg">
                    <p className="text-muted-foreground mb-4">Vous n'avez pas d'abonnement actif. Devenez premium pour un accès illimité.</p>
                    <Button asChild>
                       <Link href="/subscribe">
                            <Star className="mr-2 h-4 w-4" />
                            Devenir Premium
                        </Link>
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  )
}

function DeleteAccountSection() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            await deleteCurrentUserAccount();
            toast({
                title: 'Compte supprimé',
                description: 'Votre compte a été définitivement supprimé. Vous allez être déconnecté.',
            });
            router.push('/signup');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || "Impossible de supprimer le compte. Essayez de vous reconnecter.",
            });
        } finally {
            setIsLoading(false);
            setIsDialogOpen(false);
        }
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-destructive/50">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <CardTitle>Zone de Danger</CardTitle>
                </div>
                <CardDescription>Ces actions sont irréversibles. Soyez certain avant de continuer.</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Supprimer mon compte</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument certain ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Toutes vos données, y compris votre profil, vos progrès et vos contributions, seront définitivement supprimées. Pour confirmer, tapez <strong className="text-foreground">supprimer</strong> dans le champ ci-dessous.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         <Input 
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="supprimer"
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmationText('')}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                disabled={confirmationText.toLowerCase() !== 'supprimer' || isLoading}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Je comprends, supprimer mon compte
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
  const { toast } = useToast();
  const { user, userData, setUserData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !userData) return;
    
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;

    setIsLoading(true);
    try {
      if (user.displayName !== name) {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { name });
          setUserData({ ...userData, name });
      }
      
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

   const handlePhotoUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user || !userData) {
            return;
        }

        const file = event.target.files[0];
        const fileRef = ref(storage, `avatars/${user.uid}`);

        setIsUploading(true);

        try {
            const snapshot = await uploadBytes(fileRef, file);
            const photoURL = await getDownloadURL(snapshot.ref);

            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { photoURL });
            
            setUserData({ ...userData, photoURL });
            
            toast({
                title: 'Photo de profil mise à jour!',
                description: 'Votre nouvelle photo est maintenant visible.',
            });

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Erreur de téléversement',
                description: "Impossible de mettre à jour votre photo. Veuillez réessayer.",
            });
        } finally {
            setIsUploading(false);
        }
    };
  
  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = formData.get('new-password') as string;
    
    if (!newPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le champ ne peut pas être vide.' });
      return;
    }
    
    setIsLoading(true);
    try {
      await updatePassword(user, newPassword);
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour.',
      });
      form.reset();
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Cette opération est sensible et nécessite une nouvelle authentification. Reconnectez-vous et réessayez.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
        await signOut(auth);
        toast({
            title: 'Déconnexion réussie',
            description: 'Vous avez été déconnecté de votre compte.',
        });
        router.push('/login');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur de déconnexion',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground mt-2">Gérez les paramètres de votre compte et vos préférences.</p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {userData?.role === 'admin' && <AdminFeaturePanel />}

                <SubscriptionPanel />
                
                <Card>
                  <CardHeader>
                    <div className='flex items-center gap-3'>
                      <User className="h-6 w-6 text-primary"/>
                      <CardTitle>Profil</CardTitle>
                    </div>
                    <CardDescription>Mettez à jour les informations de votre profil.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="flex justify-center">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-2 border-primary/20">
                                    <AvatarImage src={userData?.photoURL || user?.photoURL || undefined} alt="Avatar" data-ai-hint="person" />
                                    <AvatarFallback>
                                        {userData?.name ? userData.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin"/> : <Pencil className="h-6 w-6 text-white" />}
                                </button>
                                <Input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg"
                                    onChange={handlePhotoUpdate}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" name="name" defaultValue={userData?.name || user?.displayName || ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Adresse e-mail</Label>
                        <Input id="email" name="email" type="email" defaultValue={user?.email || ''} disabled />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Enregistrer les modifications
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                     <div className='flex items-center gap-3'>
                      <KeyRound className="h-6 w-6 text-primary"/>
                      <CardTitle>Sécurité</CardTitle>
                    </div>
                    <CardDescription>Modifiez votre mot de passe.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nouveau mot de passe</Label>
                        <Input id="new-password" name="new-password" type="password" />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Changer le mot de passe
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <Bell className="h-6 w-6 text-primary"/>
                                <CardTitle>Notifications</CardTitle>
                            </div>
                            <CardDescription>Gérez vos préférences de notification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="email-notifications" className="flex-grow">Notifications par e-mail</Label>
                                <Switch id="email-notifications" defaultChecked />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label htmlFor="push-notifications">Notifications push</Label>
                                <Switch id="push-notifications" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <LogOut className="h-6 w-6 text-destructive"/>
                                <CardTitle>Session</CardTitle>
                            </div>
                            <CardDescription>Mettez fin à votre session actuelle.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoading}>
                            {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                 <DeleteAccountSection />
              </div>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
