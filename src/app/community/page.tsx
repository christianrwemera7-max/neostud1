// src/app/community/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User, Users, Loader2, Trash2, Pencil, School, Presentation, ArrowRight, Calendar, PlusCircle, Video, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Discussion, DiscussionCreationData, Training, Conference } from '@/lib/search-data';
import { AddDiscussionDialog } from '@/components/add-discussion-dialog';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditDiscussionDialog, DiscussionFormValues } from '@/components/edit-discussion-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { ConferenceFormDialog, ConferenceFormValues } from '@/components/conference-form-dialog';
import { Faculty } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function DiscussionsTab() {
    const { user, userData, loading: authLoading } = useAuth();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!userData) {
            if (!authLoading) setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const q = query(collection(db, "discussions"), where("faculty", "==", userData.faculty));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedDiscussions = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const lastReply = data.lastReplyTimestamp instanceof Timestamp 
                    ? formatDistanceToNow(data.lastReplyTimestamp.toDate(), { addSuffix: true, locale: fr })
                    : 'Jamais';
                return { id: doc.id, ...data, lastReply } as Discussion;
            });
            fetchedDiscussions.sort((a, b) => {
                const dateA = a.lastReplyTimestamp ? (a.lastReplyTimestamp as Timestamp).toMillis() : (a.createdAt as Timestamp).toMillis();
                const dateB = b.lastReplyTimestamp ? (b.lastReplyTimestamp as Timestamp).toMillis() : (b.createdAt as Timestamp).toMillis();
                return dateB - dateA;
            });
            setDiscussions(fetchedDiscussions);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching discussions:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les discussions." });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userData, authLoading, toast]);


    const handleDiscussionAdded = async (newDiscussionData: DiscussionCreationData) => {
        if (!userData || !user) return;
        try {
            const timestamp = serverTimestamp();
            await addDoc(collection(db, "discussions"), {
                ...newDiscussionData,
                author: userData.name,
                authorId: user.uid,
                avatar: userData.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                replies: 0,
                lastReplyTimestamp: timestamp,
                createdAt: timestamp,
            });
            toast({ title: "Succès!", description: "Votre discussion a été publiée." });
        } catch (error) {
            console.error("Error adding discussion:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de publier votre discussion." });
        }
    };
    
    const handleDiscussionUpdated = async (discussionId: string, data: DiscussionFormValues) => {
        try {
            await updateDoc(doc(db, "discussions", discussionId), data);
            toast({ title: "Succès!", description: "La discussion a été mise à jour." });
        } catch (error) {
            console.error("Error updating discussion:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "La mise à jour a échoué." });
        }
    };

    const handleDiscussionDeleted = async (discussionId: string) => {
        try {
            await deleteDoc(doc(db, "discussions", discussionId));
            toast({ title: "Succès!", description: "La discussion a été supprimée." });
        } catch (error) {
            console.error("Error deleting discussion:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "La suppression a échoué." });
        }
    };

    return (
        <Card className="border-none sm:border">
            <CardHeader className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 px-4 sm:px-6'>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Discussions Récentes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Échanges au sein de votre faculté.
                </CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <AddDiscussionDialog onDiscussionAdded={handleDiscussionAdded} />
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : discussions.length > 0 ? (
                    <ul className="space-y-1">
                        {discussions.map((discussion, index) => {
                            const canManage = userData?.role === 'admin' || userData?.uid === discussion.authorId;
                            return (
                            <li key={discussion.id}>
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted/50 transition-colors group relative">
                                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border shrink-0">
                                        <AvatarImage src={discussion.avatar} alt={discussion.author} data-ai-hint="person" />
                                        <AvatarFallback>{discussion.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow min-w-0 pr-10 sm:pr-0">
                                        <Link href={`/community/${discussion.id}`} className="font-semibold text-base sm:text-lg hover:text-primary transition-colors block truncate">{discussion.title}</Link>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <User className="h-3 w-3" />
                                                <span className="max-w-[80px] sm:max-w-none truncate">{discussion.author}</span>
                                            </div>
                                             <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4">{discussion.category}</Badge>
                                             <div className="flex items-center gap-1.5 shrink-0">
                                                <MessageSquare className="h-3 w-3" />
                                                <span>{discussion.replies}</span>
                                            </div>
                                            <span className="hidden xs:inline">•</span>
                                            <span className="shrink-0 italic">{discussion.lastReply}</span>
                                        </div>
                                    </div>
                                    
                                    {canManage && (
                                        <div className="absolute top-2 right-2 flex sm:relative sm:top-auto sm:right-auto gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EditDiscussionDialog
                                                discussion={discussion}
                                                onDiscussionUpdated={handleDiscussionUpdated}
                                                triggerButton={
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                                                    </Button>
                                                }
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="sm:max-w-[425px]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer la discussion ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible. La discussion sera définitivement supprimée.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDiscussionDeleted(discussion.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Confirmer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                                {index < discussions.length - 1 && <Separator className="my-1 mx-4" />}
                            </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="text-center p-12">
                         <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-4" />
                         <h3 className="text-xl font-semibold">Aucune discussion</h3>
                         <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-sm">
                           {userData 
                             ? `Il n'y a pas encore de discussion dans votre faculté. Soyez le premier !`
                             : `Connectez-vous pour voir les discussions.`
                           }
                         </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function TrainingsTab() {
  const { userData, loading: authLoading } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrainings = useCallback(async (faculty: Faculty) => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'trainings'), where('faculty', '==', faculty));
      const querySnapshot = await getDocs(q);
      const fetchedTrainings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Training));
      setTrainings(fetchedTrainings);
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les formations." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userData?.faculty) {
      fetchTrainings(userData.faculty);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [userData, authLoading, fetchTrainings]);

  return (
     <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-xl sm:text-2xl font-bold">Devenez Formateur</h2>
                        <p className="text-muted-foreground text-sm max-w-xl">
                            Partagez votre expertise, générez des revenus et aidez les étudiants de votre faculté à réussir.
                        </p>
                    </div>
                    <Button size="lg" disabled className="w-full md:w-auto rounded-xl">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Publier (Bientôt)
                    </Button>
                </div>
            </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trainings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trainings.map((training) => (
                  <Card key={training.id} className="flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="relative aspect-[3/2] overflow-hidden">
                          <Image src={training.image} alt={training.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={training.aiHint} />
                      </div>
                      <CardContent className="p-4 flex-grow space-y-3">
                          <CardTitle className="text-lg sm:text-xl line-clamp-2 leading-tight">{training.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-3">{training.description}</CardDescription>
                          <div className="pt-2 flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{training.author}</span>
                              </div>
                               <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Le {training.date}</span>
                              </div>
                          </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                          <Button asChild className="w-full rounded-xl" disabled>
                              <Link href="#">
                                  Participer • {training.price}$ <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                          </Button>
                      </CardFooter>
                  </Card>
              ))}
            </div>
          ) : (
             <Card className="text-center p-12 border-dashed bg-muted/20">
                <CardContent className="space-y-4">
                    <School className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold">Aucune formation disponible</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        {userData 
                         ? `Revenez bientôt pour découvrir les nouvelles formations en ${userData.faculty}.`
                         : `Connectez-vous pour voir les formations.`
                        }
                    </p>
                </CardContent>
            </Card>
          )}
     </div>
  );
}

function ConferencesTab() {
    const { userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const canManageContent = userData?.role === 'admin' || userData?.role === 'faculty_admin';

    const fetchConferences = useCallback(async (faculty: Faculty) => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'conferences'), where('faculty', '==', faculty));
            const querySnapshot = await getDocs(q);
            const fetchedConferences = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conference));
            setConferences(fetchedConferences);
        } catch (error) {
            console.error("Error fetching conferences:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les conférences." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (userData?.faculty) {
            fetchConferences(userData.faculty);
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [userData, authLoading, fetchConferences]);

    const handleConferenceAdded = async (data: ConferenceFormValues) => {
        try {
            const docRef = await addDoc(collection(db, "conferences"), {
                ...data,
                createdAt: serverTimestamp(),
            });
            const newConference = { id: docRef.id, ...data } as Conference;
            setConferences(prev => [newConference, ...prev]);
            toast({ title: "Succès!", description: "La conférence a été ajoutée." });
        } catch (error) {
            console.error("Error adding conference: ", error);
            toast({ variant: "destructive", title: "Erreur", description: "L'ajout a échoué." });
        }
    };

     const handleConferenceUpdated = async (conferenceId: string, data: ConferenceFormValues) => {
        try {
            await updateDoc(doc(db, "conferences", conferenceId), data);
            setConferences(prev => prev.map(c => c.id === conferenceId ? { ...c, ...data } : c));
            toast({ title: "Succès!", description: "La conférence a été mise à jour." });
        } catch (error) {
            console.error("Error updating conference: ", error);
            toast({ variant: "destructive", title: "Erreur", description: "La mise à jour a échoué." });
        }
    };


    const handleDeleteConference = async (conferenceId: string) => {
        try {
            await deleteDoc(doc(db, "conferences", conferenceId));
            setConferences(prev => prev.filter(c => c.id !== conferenceId));
            toast({ title: "Succès!", description: "La conférence a été supprimée." });
        } catch (error) {
            console.error("Error deleting conference: ", error);
            toast({ variant: "destructive", title: "Erreur", description: "La suppression a échoué." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Conférences en Ligne</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Apprenez gratuitement avec des experts de votre domaine.
                    </p>
                </div>
                 {canManageContent && (
                     <div className="w-full sm:w-auto">
                        <ConferenceFormDialog
                            onConfirm={handleConferenceAdded}
                            triggerButton={
                                <Button className="w-full sm:w-auto rounded-xl">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Ajouter
                                </Button>
                            }
                        />
                     </div>
                )}
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : conferences.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {conferences.map((conference) => (
                        <Card key={conference.id} className="flex flex-col overflow-hidden group relative hover:shadow-md transition-shadow">
                            {canManageContent && (
                                <div className="absolute top-2 right-2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ConferenceFormDialog
                                        conference={conference}
                                        onConfirm={(data) => handleConferenceUpdated(conference.id, data)}
                                        triggerButton={
                                            <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                                        }
                                    />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-7 w-7 sm:h-8 sm:w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="sm:max-w-[425px]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    La conférence sera définitivement supprimée.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteConference(conference.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Supprimer
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                            <div className="relative aspect-[3/2] overflow-hidden">
                                <Badge className="absolute top-3 left-3 z-10 text-[10px] sm:text-xs" variant={conference.status === 'upcoming' ? 'default' : 'secondary'}>
                                    {conference.status === 'upcoming' ? <Mic className="h-3 w-3 mr-1.5" /> : <Video className="h-3 w-3 mr-1.5" />}
                                    {conference.type}
                                </Badge>
                                <Image src={conference.image} alt={conference.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={conference.aiHint} />
                            </div>
                            <CardContent className="p-4 flex-grow space-y-3">
                                <CardTitle className="text-lg sm:text-xl line-clamp-2 leading-tight">{conference.title}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm line-clamp-3">{conference.description}</CardDescription>
                                <div className="pt-2 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        <span>{conference.speaker}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{conference.date}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button asChild className="w-full rounded-xl">
                                    <Link href={conference.link} target="_blank" rel="noopener noreferrer">
                                        {conference.status === 'upcoming' ? 'Accès Gratuit' : 'Voir le replay'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center p-12 border-dashed bg-muted/20">
                    <CardContent className="space-y-4">
                        <Presentation className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold">Aucune conférence</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                           {userData 
                             ? `Il n'y a pas encore de conférence planifiée pour votre faculté.`
                             : `Connectez-vous pour voir les conférences.`
                           }
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function CommunityHub() {
    const { userData } = useAuth();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'discussions';
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="space-y-8 max-w-7xl mx-auto">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Hub Communautaire</h1>
                            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                                {userData ? `Échangez avec les étudiants en ${userData.faculty}.` : 'Rejoignez notre communauté étudiante.'}
                            </p>
                        </div>
                        
                        <Tabs defaultValue={defaultTab} className="w-full space-y-6">
                          <TabsList className="grid w-full grid-cols-3 h-11 sm:h-12 p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="discussions" className="rounded-lg text-xs sm:text-sm">Discussions</TabsTrigger>
                            <TabsTrigger value="trainings" className="rounded-lg text-xs sm:text-sm">Formations</TabsTrigger>
                            <TabsTrigger value="conferences" className="rounded-lg text-xs sm:text-sm">Conférences</TabsTrigger>
                          </TabsList>
                          <TabsContent value="discussions" className="mt-0 focus-visible:ring-0">
                            <DiscussionsTab />
                          </TabsContent>
                          <TabsContent value="trainings" className="mt-0 focus-visible:ring-0">
                            <TrainingsTab />
                          </TabsContent>
                           <TabsContent value="conferences" className="mt-0 focus-visible:ring-0">
                            <ConferencesTab />
                          </TabsContent>
                        </Tabs>

                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function CommunityPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <CommunityHub />
        </Suspense>
    );
}
