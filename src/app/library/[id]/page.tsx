// src/app/library/[id]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, Calendar, Tag, ArrowRight, BookCopy, Loader2, Lock, ArrowLeft, Star, Heart, MessageSquare, Pencil, Trash2 } from "lucide-react";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { courseNames, resourceIcons } from '@/lib/constants';
import { Resource, Comment } from '@/lib/search-data';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { addComment, submitRating, toggleFavorite, updateComment, deleteComment } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditCommentDialog } from '@/components/edit-comment-dialog';

function StarRating({ rating, totalRatings, resourceId, userId }: { rating: number, totalRatings: number, resourceId: string, userId: string | null }) {
    const [hoverRating, setHoverRating] = useState(0);
    const { toast } = useToast();

    const handleRating = async (newRating: number) => {
        if (!userId) {
            toast({ variant: 'destructive', title: "Connexion requise", description: "Vous devez être connecté pour noter." });
            return;
        }
        try {
            await submitRating({ resourceId, userId, rating: newRating });
            toast({ title: "Merci !", description: "Votre note a été enregistrée." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de soumettre votre note." });
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            "h-8 w-8 cursor-pointer transition-colors",
                            (hoverRating || Math.round(rating)) >= star
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/50"
                        )}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRating(star)}
                    />
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                Note moyenne : <span className="font-bold text-foreground">{rating.toFixed(1)}</span>/5 ({totalRatings} votes)
            </p>
        </div>
    );
}

function CommentsSection({ resourceId }: { resourceId: string }) {
    const { user, userData } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'library', resourceId, 'comments'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [resourceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData || !newComment.trim()) {
            toast({ variant: 'destructive', title: "Erreur", description: "Vous devez être connecté et écrire un message." });
            return;
        }
        setIsSubmitting(true);
        try {
            await addComment({
                resourceId,
                userId: user.uid,
                authorName: userData.name,
                authorAvatar: userData.photoURL || '',
                content: newComment,
            });
            setNewComment('');
            toast({ title: "Succès", description: "Commentaire publié." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de publier le commentaire." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateComment = async (commentId: string, content: string) => {
        if (!user) return;
        try {
            await updateComment({ resourceId, commentId, content, userId: user.uid });
            toast({ title: 'Succès', description: 'Votre commentaire a été mis à jour.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!user) return;
        try {
            await deleteComment({ resourceId, commentId, userId: user.uid });
            toast({ title: 'Succès', description: 'Votre commentaire a été supprimé.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Commentaires ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {user && (
                    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
                        <Textarea
                            placeholder="Ajoutez votre commentaire..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Button type="submit" size="sm" disabled={!newComment.trim() || isSubmitting}>
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Envoyer
                        </Button>
                    </form>
                )}
                <Separator />
                {isLoading ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                ) : comments.length > 0 ? (
                    <div className="space-y-4">
                        {comments.map(comment => {
                           const canManage = user?.uid === comment.authorId;
                           return (
                                <div key={comment.id} className="flex items-start gap-3 group">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={comment.authorAvatar} data-ai-hint="person" />
                                        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 rounded-lg bg-muted/50 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{comment.authorName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : ''}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <EditCommentDialog 
                                                        comment={comment} 
                                                        onCommentUpdated={handleUpdateComment}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                          </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action supprimera votre commentaire définitivement.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                </div>
                           );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">Aucun commentaire pour l'instant.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ResourceDetailPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();

    const [resource, setResource] = useState<Resource | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);

    const hasPremiumAccess = userData?.role === 'admin' || userData?.role === 'premium_student';

    useEffect(() => {
        if (!id) return;
        const docRef = doc(db, 'library', id);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate().toLocaleDateString('fr-FR')
                    : 'Date inconnue';
                setResource({ id: docSnap.id, ...data, createdAt } as Resource);
            } else {
                toast({ variant: 'destructive', title: "Erreur", description: "Ressource non trouvée." });
                router.push('/library');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [id, router, toast]);

    useEffect(() => {
        if (user && resource) {
            const favDocRef = doc(db, 'users', user.uid, 'favorites', resource.id);
            const unsubscribe = onSnapshot(favDocRef, (docSnap) => {
                setIsFavorited(docSnap.exists());
            });
            return () => unsubscribe();
        }
    }, [user, resource]);


    const handleFavoriteClick = async () => {
        if (!user || !resource) {
            toast({ variant: 'destructive', title: "Connexion requise" });
            return;
        }
        await toggleFavorite({ resourceId: resource.id, userId: user.uid });
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!resource) {
        return null;
    }

    const Icon = resourceIcons[resource.type] || FileText;
    const isLocked = resource.premium && !hasPremiumAccess;
    const isMedia = resource.type === 'Podcast' || resource.type === 'Vidéo explicative';

    return (
        <SidebarProvider>
            <Sidebar><SidebarNav /></Sidebar>
            <SidebarInset>
                <Header />
                <main className="p-4 lg:p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/library"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à la bibliothèque</Link>
                            </Button>
                        </div>
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="w-fit">{resource.type}</Badge>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 z-10" onClick={handleFavoriteClick}>
                                        <Heart className={cn("h-6 w-6", isFavorited ? "text-red-500 fill-current" : "text-muted-foreground")} />
                                    </Button>
                                </div>
                                <CardTitle className="text-3xl pt-2">{resource.title}</CardTitle>
                                <CardDescription>{resource.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Separator />
                                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>Publié par {resource.author}</span></div>
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Le {resource.createdAt}</span></div>
                                    <div className="flex items-center gap-2"><BookCopy className="h-4 w-4" /><span>{courseNames[resource.courseId]}</span></div>
                                    <div className="flex items-center gap-2"><Tag className="h-4 w-4" /><span>{resource.faculty}</span></div>
                                </div>
                                <Separator />
                                {isLocked ? (
                                    <div className="text-center p-8 bg-amber-500/10 rounded-lg">
                                        <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                                        <h3 className="font-bold text-lg">Contenu Premium</h3>
                                        <p className="text-muted-foreground">Cette ressource est réservée aux abonnés.</p>
                                        <Button asChild className="mt-4 bg-amber-500 hover:bg-amber-600">
                                            <Link href="/subscribe">Devenir Premium</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                       <Button asChild size="lg">
                                            <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Icon className="mr-2 h-5 w-5" />
                                                Ouvrir la ressource
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Évaluez cette ressource</CardTitle>
                                <CardDescription>Votre avis aide les autres étudiants.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StarRating
                                    rating={resource.rating || 0}
                                    totalRatings={resource.ratingCount || 0}
                                    resourceId={resource.id}
                                    userId={user?.uid || null}
                                />
                            </CardContent>
                        </Card>

                        <CommentsSection resourceId={id} />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
