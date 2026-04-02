// src/app/admin/universities/page.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch, query, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldAlert, Trash2, Building, PlusCircle, Pencil, BookOpen, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { University, Faculty, FACULTY_NAMES, FacultyName } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface UniversityWithFaculties extends University {
  faculties: Faculty[];
}

function UniversityFormDialog({ onConfirm, university }: { onConfirm: (name: string) => Promise<void>, university?: University }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(university?.name || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        await onConfirm(name);
        setIsSubmitting(false);
        setName('');
        setOpen(false);
    };
    
    useEffect(() => {
        if(open) setName(university?.name || '');
    }, [open, university])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {university ? (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                ) : (
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une université</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{university ? 'Modifier' : 'Ajouter'} une université</DialogTitle>
                    <DialogDescription>Entrez le nom de l'université partenaire.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label htmlFor="name">Nom de l'université</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Université de Kinshasa" />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {university ? 'Enregistrer' : 'Ajouter'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FacultyFormDialog({ onConfirm, universityId, faculty, existingFaculties }: { onConfirm: (name: FacultyName) => Promise<void>, universityId: string, faculty?: Faculty, existingFaculties: FacultyName[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState<FacultyName | ''>(faculty?.name || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const availableFaculties = FACULTY_NAMES.filter(fname => !existingFaculties.includes(fname) || (faculty && fname === faculty.name));

    const handleSubmit = async () => {
        if (!name) return;
        setIsSubmitting(true);
        await onConfirm(name);
        setIsSubmitting(false);
        setName('');
        setOpen(false);
    };

    useEffect(() => {
        if(open) setName(faculty?.name || '');
    }, [open, faculty])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {faculty ? (
                     <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                ): (
                    <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Ajouter une faculté</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{faculty ? 'Modifier' : 'Ajouter'} une faculté</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label>Nom de la faculté</Label>
                     <Select onValueChange={(value: FacultyName) => setName(value)} value={name} disabled={!!faculty}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une faculté" />
                        </SelectTrigger>
                        <SelectContent>
                             {availableFaculties.map(fname => <SelectItem key={fname} value={fname}>{fname}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !name}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {faculty ? 'Enregistrer' : 'Ajouter'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AdminUniversitiesPage() {
  const { userData, loading: authLoading } = useAuth();
  const [universities, setUniversities] = useState<UniversityWithFaculties[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

   const fetchAndGroupData = async () => {
      try {
        const [uniSnap, facSnap, userSnap] = await Promise.all([
            getDocs(collection(db, 'universities')),
            getDocs(collection(db, 'faculties')),
            getDocs(collection(db, 'users')),
        ]);

        const facultiesData = facSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
        
        const userCountsByUniversity: Record<string, number> = {};
        const userCountsByFaculty: Record<string, number> = {};
        userSnap.forEach(doc => {
            const user = doc.data();
            if (user.universityId) {
                userCountsByUniversity[user.universityId] = (userCountsByUniversity[user.universityId] || 0) + 1;
            }
             if (user.facultyId) {
                userCountsByFaculty[user.facultyId] = (userCountsByFaculty[user.facultyId] || 0) + 1;
            }
        });


        const universitiesData = uniSnap.docs.map(doc => {
            const uniId = doc.id;
            const uniFaculties = facultiesData
                .filter(f => f.universityId === uniId)
                .map(f => ({ ...f, studentCount: userCountsByFaculty[f.id] || 0 }))
                .sort((a,b) => a.name.localeCompare(b.name));

            return { 
                id: uniId, 
                ...doc.data(), 
                faculties: uniFaculties,
                studentCount: userCountsByUniversity[uniId] || 0,
            } as UniversityWithFaculties;
        });
        
        universitiesData.sort((a, b) => a.name.localeCompare(b.name));
        setUniversities(universitiesData);

      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.' });
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    if (userData?.role === 'admin' && !authLoading) {
      fetchAndGroupData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [userData, authLoading, toast]);


  const handleUniversityAdd = async (name: string) => {
    try {
        await addDoc(collection(db, 'universities'), { name });
        toast({ title: 'Succès', description: `L'université "${name}" a été ajoutée.` });
        fetchAndGroupData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: "L'ajout a échoué." });
    }
  };

  const handleUniversityDelete = async (uni: UniversityWithFaculties) => {
    if (uni.studentCount && uni.studentCount > 0) {
        toast({ variant: 'destructive', title: 'Action impossible', description: 'Vous ne pouvez pas supprimer une université qui a des étudiants inscrits.' });
        return;
    }
    
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "universities", uni.id));
        uni.faculties.forEach(f => batch.delete(doc(db, "faculties", f.id)));
        await batch.commit();

        toast({ title: "Université supprimée", description: `"${uni.name}" et ses facultés ont été supprimées.` });
        fetchAndGroupData();
    } catch (error) {
         toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression a échoué.' });
    }
  };
  
  const handleFacultyAdd = async (universityId: string, name: FacultyName) => {
      try {
        await addDoc(collection(db, 'faculties'), { name, universityId });
        toast({ title: 'Succès', description: `La faculté "${name}" a été ajoutée.` });
        fetchAndGroupData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: "L'ajout a échoué." });
    }
  }

  const handleFacultyDelete = async (faculty: Faculty) => {
      if (faculty.studentCount && faculty.studentCount > 0) {
        toast({ variant: 'destructive', title: 'Action impossible', description: 'Vous ne pouvez pas supprimer une faculté qui a des étudiants inscrits.' });
        return;
    }
    try {
        await deleteDoc(doc(db, "faculties", faculty.id));
        toast({ title: "Faculté supprimée", description: `"${faculty.name}" a été supprimée.` });
        fetchAndGroupData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression a échoué.' });
    }
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (userData?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="max-w-md text-center p-8">
          <CardHeader><ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4"/><CardTitle>Accès Refusé</CardTitle></CardHeader>
          <CardContent><CardDescription>Cette page est réservée aux administrateurs.</CardDescription></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar><SidebarNav /></Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Universités & Facultés</h1>
                <p className="text-muted-foreground mt-2">Ajoutez ou supprimez des universités et leurs facultés affiliées.</p>
              </div>
               <UniversityFormDialog onConfirm={handleUniversityAdd} />
            </div>
          
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Universités</CardTitle>
                    <CardDescription>Total de {universities.length} universités partenaires.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                    {universities.map(uni => (
                        <AccordionItem value={uni.id} key={uni.id}>
                            <div className="flex items-center w-full pr-4 py-4">
                                <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <Building className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium text-lg">{uni.name}</span>
                                        <Badge variant="secondary">{uni.studentCount || 0} étudiant(s)</Badge>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 pl-4">
                                    <UniversityFormDialog onConfirm={() => Promise.resolve()} university={uni} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action supprimera <strong>{uni.name}</strong> et toutes ses facultés. Action irréversible.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUniversityDelete(uni)}>Confirmer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <AccordionContent>
                                <div className="pl-8 pt-4">
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold">Facultés affiliées</h4>
                                        <FacultyFormDialog onConfirm={(name) => handleFacultyAdd(uni.id, name)} universityId={uni.id} existingFaculties={uni.faculties.map(f => f.name)} />
                                     </div>
                                      {uni.faculties.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nom de la faculté</TableHead>
                                                    <TableHead>Étudiants</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uni.faculties.map(faculty => (
                                                    <TableRow key={faculty.id}>
                                                        <TableCell><BookOpen className="h-4 w-4 mr-2 inline-block"/>{faculty.name}</TableCell>
                                                        <TableCell><Users className="h-4 w-4 mr-2 inline-block"/>{faculty.studentCount || 0}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <FacultyFormDialog onConfirm={() => Promise.resolve()} universityId={uni.id} faculty={faculty} existingFaculties={uni.faculties.map(f => f.name)} />
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                        <AlertDialogDescription>Supprimer la faculté <strong>{faculty.name}</strong> ?</AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleFacultyDelete(faculty)}>Confirmer</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                      ) : (
                                        <p className="text-muted-foreground text-sm text-center py-4">Aucune faculté ajoutée pour cette université.</p>
                                      )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                     {universities.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Aucune université trouvée. Commencez par en ajouter une.</p>
                     )}
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
