'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { University, Faculty } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Nom trop court." }),
  email: z.string().email({ message: "Email invalide." }),
  password: z.string().min(6, { message: "6 caractères minimum." }),
  studyLevel: z.string({ required_error: "Requis." }),
  universityId: z.string({ required_error: "Requis." }),
  facultyId: z.string({ required_error: "Requis." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
    const [step, setStep] = useState(1);
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, trigger } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        mode: 'onChange'
    });
    const { toast } = useToast();
    const router = useRouter();

    const [universities, setUniversities] = useState<University[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
    const [isLoadingFaculties, setIsLoadingFaculties] = useState(false);

    const selectedUniversityId = watch('universityId');

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "universities"));
                setUniversities(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as University)));
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Chargement des universités échoué.' });
            } finally {
                setIsLoadingUniversities(false);
            }
        };
        fetchUniversities();
    }, [toast]);
    
    useEffect(() => {
        if (!selectedUniversityId) return;
        const fetchFaculties = async () => {
            setIsLoadingFaculties(true);
            try {
                const q = query(collection(db, "faculties"), where("universityId", "==", selectedUniversityId));
                const querySnapshot = await getDocs(q);
                setFaculties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty)));
            } finally {
                setIsLoadingFaculties(false);
            }
        };
        fetchFaculties();
    }, [selectedUniversityId]);

    const handleNext = async () => {
        const isValid = await trigger(['name', 'email', 'password']);
        if (isValid) setStep(2);
    };

    const onSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: data.name });
            
            const faculty = faculties.find(f => f.id === data.facultyId);
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: data.name,
                email: data.email,
                studyLevel: data.studyLevel,
                universityId: data.universityId,
                faculty: faculty?.name || 'Droit',
                role: 'student'
            });
            
            toast({ title: "Bienvenue !", description: "Compte créé." });
            router.push('/');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    };

    return (
        <div className="space-y-8 page-transition">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight">Rejoignez NeoStud</h1>
                <p className="text-muted-foreground mt-2">
                    {step === 1 ? "Étape 1 : Vos informations personnelles" : "Étape 2 : Votre profil académique"}
                </p>
            </div>

            <div className="space-y-2">
                <Progress value={step === 1 ? 50 : 100} className="h-1.5" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" {...register("name")} placeholder="John Doe" className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" {...register("email")} type="email" placeholder="nom@exemple.com" className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input id="password" {...register("password")} type="password" placeholder="6+ caractères" className="h-11 rounded-xl" />
                        </div>
                        <Button type="button" onClick={handleNext} className="w-full h-11 rounded-xl font-bold">
                            Continuer <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                        <div className="space-y-2">
                            <Label>Niveau d'étude</Label>
                            <Select onValueChange={(v) => setValue('studyLevel', v)}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Niveau" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="l1">Licence 1</SelectItem>
                                    <SelectItem value="l2">Licence 2</SelectItem>
                                    <SelectItem value="l3">Licence 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Université</Label>
                            <Select onValueChange={(v) => setValue('universityId', v)}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Université" /></SelectTrigger>
                                <SelectContent>
                                    {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Faculté</Label>
                            <Select onValueChange={(v) => setValue('facultyId', v)}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Faculté" /></SelectTrigger>
                                <SelectContent>
                                    {faculties.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 rounded-xl">Retour</Button>
                            <Button type="submit" className="h-11 rounded-xl font-bold" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'S\'inscrire'}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
            <p className="text-center text-sm text-muted-foreground">
                Déjà inscrit ? <Link href="/login" className="text-primary font-bold hover:underline">Se connecter</Link>
            </p>
        </div>
    );
}