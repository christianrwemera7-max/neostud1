'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, BookCopy, Loader2, Lock, Trash2, BookCheck, Mic, Video, HelpCircle, PartyPopper, Heart, Star, MessageSquare, FilterX } from "lucide-react";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { AddResourceDialog } from '@/components/add-resource-dialog';
import type { ResourceFormValues } from '@/components/add-resource-dialog';
import { courseNames, resourceIcons, ResourceType } from '@/lib/constants';
import { Resource } from '@/lib/search-data';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditResourceDialog } from '@/components/edit-resource-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toggleFavorite } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const orderedResourceTypes: ResourceType[] = [
  'Notes de cours',
  'Fiche de révision',
  'Podcast',
  'Vidéo explicative',
  'Quiz'
];

const typeIcons: Record<ResourceType, React.ElementType> = {
  'Notes de cours': FileText,
  'Fiche de révision': BookCheck,
  'Podcast': Mic,
  'Vidéo explicative': Video,
  'Quiz': HelpCircle,
};

type SemesterResources = Record<ResourceType, Resource[]>;
type GroupedResources = Record<string, {
    'semestre-1': SemesterResources;
    'semestre-2': SemesterResources;
}>;

function LibraryContent() {
  const { user, userData } = useAuth();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  
  const courseIdFromUrl = searchParams.get('courseId');
  const [selectedCourse, setSelectedCourse] = useState<string>(courseIdFromUrl || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { toast } = useToast();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowSuccessAlert(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const favColRef = collection(db, 'users', user.uid, 'favorites');
      const unsubscribe = onSnapshot(favColRef, (snapshot) => {
        setUserFavorites(snapshot.docs.map(doc => doc.id));
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!userData?.faculty) {
        if (!isLoading) setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const constraints = [where('faculty', '==', userData.faculty)];
    
    if(selectedCourse !== 'all') {
      constraints.push(where('courseId', '==', selectedCourse));
    }
    if(selectedType !== 'all') {
      constraints.push(where('type', '==', selectedType));
    }

    const q = query(collection(db, 'library'), ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let fetchedResources = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toLocaleDateString('fr-FR') 
                : 'Date inconnue';
            return { id: doc.id, ...data, createdAt } as Resource;
        });

        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            fetchedResources = fetchedResources.filter(r => 
                r.title.toLowerCase().includes(lowercasedQuery) ||
                r.description.toLowerCase().includes(lowercasedQuery)
            );
        }

        setResources(fetchedResources);
        setIsLoading(false);
    }, (error) => {
      console.error("Error fetching resources:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les ressources." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.faculty, selectedCourse, selectedType, searchQuery, toast]);

  const hasPremiumAccess = userData?.role === 'admin' || userData?.role === 'premium_student';
  const canManageContent = userData?.role === 'admin' || userData?.role === 'faculty_admin';

  const handleResourceAdded = async (data: ResourceFormValues) => {
     if (!userData) return;
     try {
       await addDoc(collection(db, "library"), {
         ...data,
         author: userData.name,
         createdAt: serverTimestamp(),
         rating: 0,
         ratingCount: 0,
         favoritesCount: 0,
         commentsCount: 0,
       });
       toast({ title: "Succès!", description: "Ressource ajoutée avec succès." });
     } catch (error) {
       toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la ressource." });
     }
  }

  const handleResourceUpdated = async (resourceId: string, data: ResourceFormValues) => {
    try {
        await updateDoc(doc(db, "library", resourceId), data);
        toast({ title: "Succès!", description: "Ressource mise à jour." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "La mise à jour a échoué." });
    }
  }

  const handleResourceDeleted = async (resourceId: string) => {
    try {
        await deleteDoc(doc(db, "library", resourceId));
        toast({ title: "Succès!", description: "La ressource a été supprimée." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "La suppression a échoué." });
    }
  }

  const groupedResources = useMemo(() => {
    return resources.reduce((acc, resource) => {
        const { courseId, semester, type } = resource;
        if (!acc[courseId]) {
            acc[courseId] = {
                'semestre-1': {} as SemesterResources,
                'semestre-2': {} as SemesterResources,
            };
            orderedResourceTypes.forEach(t => {
                acc[courseId]['semestre-1'][t] = [];
                acc[courseId]['semestre-2'][t] = [];
            });
        }
        if (semester && type && acc[courseId][semester]) {
            if (!acc[courseId][semester][type]) acc[courseId][semester][type] = [];
            acc[courseId][semester][type].push(resource);
        }
        return acc;
    }, {} as GroupedResources);
  }, [resources]);

  const sortedCourseIds = Object.keys(groupedResources).sort();

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const Icon = resourceIcons[resource.type] || FileText;
    const isLocked = resource.premium && !hasPremiumAccess;
    const isFavorited = userFavorites.includes(resource.id);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast({ variant: 'destructive', title: "Connexion requise" });
            return;
        }
        await toggleFavorite({ resourceId: resource.id, userId: user.uid });
    };

    return (
        <Card key={resource.id} className={cn('flex flex-col group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full', isLocked ? 'border-amber-500/30 bg-amber-500/5' : 'hover:border-primary/30')}>
             {canManageContent && (
                <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditResourceDialog resource={resource} onResourceUpdated={handleResourceUpdated} />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[425px]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleResourceDeleted(resource.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmer</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            <CardHeader className="pb-3 space-y-3">
                <div className="flex items-start justify-between">
                    <div className={cn('p-2.5 rounded-xl flex items-center justify-center transition-colors', isLocked ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary')}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                        {resource.premium && (
                            <Badge variant={isLocked ? 'default' : 'secondary'} className={cn("text-[10px] sm:text-xs", isLocked ? 'bg-amber-500 text-white' : 'text-amber-600 border-amber-200')}>
                                {isLocked && <Lock className="h-2.5 w-2.5 mr-1"/>}
                                Premium
                            </Badge>
                        )}
                         <Button size="icon" variant="ghost" className="h-8 w-8 z-10 hover:bg-red-50" onClick={handleFavoriteClick}>
                            <Heart className={cn("h-5 w-5 transition-all", isFavorited ? "text-red-500 fill-red-500 scale-110" : "text-muted-foreground")} />
                        </Button>
                    </div>
                </div>
                <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors">
                  <Link href={`/library/${resource.id}`} className="hover:underline line-clamp-2">{resource.title}</Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
                <CardDescription className="line-clamp-2 text-xs sm:text-sm">{resource.description}</CardDescription>
            </CardContent>
            <Separator className="opacity-50" />
            <CardFooter className="py-3 px-4 justify-between items-center text-[10px] sm:text-xs text-muted-foreground mt-auto">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-foreground">{(resource.rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{resource.commentsCount || 0}</span>
                    </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/5 font-semibold">
                    <Link href={isLocked ? "/subscribe" : `/library/${resource.id}`}>
                        {isLocked ? "S'abonner" : "Ouvrir"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
  };

  const renderSemesterSection = (semesterResources: SemesterResources) => {
      return orderedResourceTypes.map(type => {
          const resourcesOfType = semesterResources[type] || [];
          if (resourcesOfType.length === 0) return null;
          const Icon = typeIcons[type];
          return (
              <div key={type} className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-muted-foreground px-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase">{type}</span>
                  </div>
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {resourcesOfType.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
                  </div>
              </div>
          );
      }).filter(Boolean);
  };

  const resetFilters = () => {
    setSelectedCourse('all');
    setSelectedType('all');
    setSearchQuery('');
  };

  return (
    <SidebarProvider>
      <Sidebar><SidebarNav /></Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="space-y-8 sm:space-y-10">
            <div className="space-y-6">
              {showSuccessAlert && (
                  <Alert className="bg-green-50 border-green-200 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <PartyPopper className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-bold">Abonnement Activé !</AlertTitle>
                    <AlertDescription className="text-green-700">Vous avez maintenant un accès complet à toutes les ressources Premium.</AlertDescription>
                  </Alert>
              )}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Bibliothèque</h1>
                      <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm sm:text-base">
                        {userData ? `Ressources organisées pour votre parcours en ${userData.faculty}.` : 'Connectez-vous pour voir vos ressources.'}
                      </p>
                  </div>
                  {canManageContent && <div className="w-full sm:w-auto"><AddResourceDialog onResourceAdded={handleResourceAdded}/></div>}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 bg-card p-3 sm:p-4 rounded-xl border shadow-sm">
                   <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                        <Input
                            type="search"
                            placeholder="Rechercher..."
                            className="bg-background h-9 sm:h-10 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                   </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm sm:w-[180px]"><SelectValue placeholder="Promotion" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tout</SelectItem>
                        {Object.entries(courseNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                     <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm sm:w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tout</SelectItem>
                        {orderedResourceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {(selectedCourse !== 'all' || selectedType !== 'all' || searchQuery) && (
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary w-full sm:w-auto">
                          <FilterX className="mr-2 h-4 w-4" /> Réinitialiser
                      </Button>
                  )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">Chargement de la bibliothèque...</p>
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-12 sm:space-y-16">
                {sortedCourseIds.map(courseId => {
                    const semesters = groupedResources[courseId];
                    const s1 = renderSemesterSection(semesters['semestre-1']);
                    const s2 = renderSemesterSection(semesters['semestre-2']);
                    if (s1.length === 0 && s2.length === 0) return null;

                    return (
                        <section key={courseId} className="space-y-6 sm:space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">{courseNames[courseId] || courseId}</h2>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            
                            {s1.length > 0 && (
                                <div className="space-y-6">
                                    <Badge variant="outline" className="px-2 py-0.5 sm:px-3 sm:py-1 bg-muted/50 text-muted-foreground border-dashed text-[10px] sm:text-xs">PREMIER SEMESTRE</Badge>
                                    <div className="space-y-8">{s1}</div>
                                </div>
                            )}

                             {s2.length > 0 && (
                                <div className="space-y-6 pt-4">
                                    <Badge variant="outline" className="px-2 py-0.5 sm:px-3 sm:py-1 bg-muted/50 text-muted-foreground border-dashed text-[10px] sm:text-xs">DEUXIÈME SEMESTRE</Badge>
                                    <div className="space-y-8">{s2}</div>
                                </div>
                            )}
                        </section>
                    )
                })}
              </div>
            ) : (
               <Card className="text-center p-8 sm:p-16 border-dashed bg-muted/20">
                  <CardContent className="space-y-4">
                      <BookCopy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Aucune ressource trouvée</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">Essayez d'ajuster vos filtres ou effectuez une recherche différente.</p>
                      </div>
                      <Button onClick={resetFilters} variant="outline" className="mt-2 rounded-xl">Tout afficher</Button>
                  </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function LibraryPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <LibraryContent />
        </React.Suspense>
    );
}
