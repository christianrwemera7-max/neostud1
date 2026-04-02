// src/app/community/[id]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Calendar, ArrowLeft, Trash2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Discussion } from '@/lib/search-data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DiscussionReply } from '@/components/discussion-reply';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditDiscussionDialog, DiscussionFormValues } from '@/components/edit-discussion-dialog';

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userData } = useAuth();
  
  const canManage = userData?.role === 'admin' || (discussion && userData?.uid === discussion.authorId);

  const fetchDiscussion = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, "discussions", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toLocaleDateString('fr-FR')
            : 'Date inconnue';
        
        const discussionData = { 
          id: docSnap.id, 
          ...data, 
          createdAt 
        } as Discussion;

        setDiscussion(discussionData);

      } else {
        toast({ variant: 'destructive', title: "Erreur", description: "Cette discussion n'existe pas." });
        router.push('/community');
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger la discussion." });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast, router]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);
  
  const handleDiscussionUpdated = async (discussionId: string, data: DiscussionFormValues) => {
        try {
            await updateDoc(doc(db, "discussions", discussionId), data);
            setDiscussion(prev => prev ? { ...prev, ...data } : null);
            toast({ title: "Succès!", description: "La discussion a été mise à jour." });
        } catch (error) {
            console.error("Error updating discussion:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "La mise à jour a échoué." });
        }
    };

  const handleDeleteDiscussion = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "discussions", id));
      toast({ title: "Succès!", description: "La discussion a été supprimée." });
      router.push('/community');
    } catch (error) {
      console.error("Error deleting discussion:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "La suppression a échoué." });
    }
  };


  if (isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
            <SidebarNav />
        </Sidebar>
        <SidebarInset>
            <Header />
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        </SidebarInset>
    </SidebarProvider>
    );
  }
  
  const content = (
      <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
         <Button asChild variant="outline" size="sm">
            <Link href="/community"><ArrowLeft className="mr-2 h-4 w-4"/> Retour à la communauté</Link>
         </Button>
         {canManage && discussion && (
            <div className="flex items-center gap-2">
                <EditDiscussionDialog 
                    discussion={discussion} 
                    onDiscussionUpdated={handleDiscussionUpdated}
                    triggerButton={
                        <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4"/> Modifier</Button>
                    }
                />
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Supprimer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette discussion ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible et supprimera également toutes les réponses associées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteDiscussion}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
         )}
       </div>
       <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit mb-4">{discussion?.category}</Badge>
          <CardTitle className="text-3xl">{discussion?.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={discussion?.avatar} alt={discussion?.author} data-ai-hint="person" />
                <AvatarFallback>{discussion?.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{discussion?.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Publié le {discussion?.createdAt}</span>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 text-base whitespace-pre-wrap">
          <p>{discussion?.content}</p>
        </CardContent>
      </Card>
      
      {discussion && <DiscussionReply discussionId={discussion.id} />}

    </div>
  );

  if (!discussion) {
    return (
     <SidebarProvider>
        <Sidebar>
            <SidebarNav />
        </Sidebar>
        <SidebarInset>
            <Header />
            <main className="p-4 lg:p-6">
              <div className="text-center py-10">
                <h1 className="text-2xl font-bold">Discussion non trouvée</h1>
                <p className="text-muted-foreground mt-2">Le lien est peut-être incorrect ou la discussion a été supprimée.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/community">Retour à la communauté</Link>
                </Button>
              </div>
             </main>
        </SidebarInset>
    </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarNav />
        </Sidebar>
        <SidebarInset>
            <Header />
            <main className="p-4 lg:p-6">
                {content}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
