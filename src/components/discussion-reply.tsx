// src/components/discussion-reply.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Trash2, Pencil } from 'lucide-react';
import { Reply } from '@/lib/search-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditReplyDialog } from './edit-reply-dialog';


interface DiscussionReplyProps {
  discussionId: string;
}

export function DiscussionReply({ discussionId }: DiscussionReplyProps) {
  const { userData, user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const repliesQuery = query(collection(db, `discussions/${discussionId}/replies`), orderBy('createdAtTimestamp', 'asc'));
    
    const unsubscribe = onSnapshot(repliesQuery, (querySnapshot) => {
      const fetchedReplies = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAtTimestamp instanceof Timestamp 
            ? data.createdAtTimestamp.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Date inconnue';
        return { id: doc.id, ...data, createdAt } as Reply;
      });
      setReplies(fetchedReplies);
      setIsLoadingReplies(false);
    }, (error) => {
      console.error("Error fetching replies: ", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les réponses." });
      setIsLoadingReplies(false);
    });

    return () => unsubscribe();
  }, [discussionId, toast]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || newReplyContent.trim() === '') return;

    setIsSubmitting(true);
    try {
      const repliesCollectionRef = collection(db, `discussions/${discussionId}/replies`);
      await addDoc(repliesCollectionRef, {
        content: newReplyContent,
        author: userData.name,
        authorId: user.uid,
        avatar: userData.photoURL || `https://picsum.photos/100/100?random=${user.uid}`,
        createdAtTimestamp: serverTimestamp(),
      });

      const discussionDocRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionDocRef, {
        replies: increment(1),
        lastReply: new Date().toLocaleDateString('fr-FR'),
        lastReplyTimestamp: serverTimestamp(),
      });

      setNewReplyContent('');
      toast({ title: 'Succès', description: 'Votre réponse a été publiée.' });
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'envoyer votre réponse." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyUpdate = async (replyId: string, newContent: string) => {
    try {
        await updateDoc(doc(db, `discussions/${discussionId}/replies`, replyId), {
            content: newContent
        });
        toast({ title: 'Succès', description: 'Votre réponse a été mise à jour.' });
    } catch (error) {
        console.error("Error updating reply:", error);
        toast({ variant: 'destructive', title: "Erreur", description: "Impossible de mettre à jour la réponse." });
    }
  };

  const handleReplyDelete = async (replyId: string) => {
    try {
      await deleteDoc(doc(db, `discussions/${discussionId}/replies`, replyId));

      const discussionDocRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionDocRef, {
        replies: increment(-1),
      });

      toast({ title: 'Succès', description: 'Votre réponse a été supprimée.' });
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer votre réponse." });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Réponses ({replies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoadingReplies ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : replies.length > 0 ? (
            replies.map((reply, index) => {
              const canManage = userData?.role === 'admin' || userData?.uid === reply.authorId;
              return (
              <div key={reply.id} className="group">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={reply.avatar} alt={reply.author} data-ai-hint="person" />
                    <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{reply.author}</p>
                      <p className="text-xs text-muted-foreground">{reply.createdAt}</p>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{reply.content}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <EditReplyDialog reply={reply} onReplyUpdated={handleReplyUpdate}>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </EditReplyDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce commentaire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleReplyDelete(reply.id)}>Confirmer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  )}
                </div>
                 {index < replies.length - 1 && <Separator className="mt-6" />}
              </div>
              )
            })
          ) : (
            <p className="text-center text-muted-foreground py-4">Soyez le premier à répondre !</p>
          )}

          {userData && (
            <div className="pt-6">
               <Separator className="mb-6"/>
              <form onSubmit={handleReplySubmit} className="flex flex-col items-start gap-4">
                 <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={userData.photoURL || undefined} alt={userData.name} data-ai-hint="person" />
                        <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Textarea
                        value={newReplyContent}
                        onChange={(e) => setNewReplyContent(e.target.value)}
                        placeholder="Exprimez-vous..."
                        rows={3}
                        disabled={isSubmitting}
                        className="flex-grow"
                    />
                 </div>
                 <Button type="submit" disabled={isSubmitting || newReplyContent.trim() === ''} className="self-end">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Répondre
                </Button>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
