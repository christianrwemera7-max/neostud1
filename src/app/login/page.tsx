// src/app/login/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(1, { message: "Veuillez entrer votre mot de passe." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });
    const { toast } = useToast();
    const router = useRouter();

    const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            router.push('/');
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Erreur de connexion",
                description: "L'adresse e-mail ou le mot de passe est incorrect.",
            });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight">Content de vous revoir</h1>
                <p className="text-muted-foreground">
                    Entrez vos identifiants pour accéder à votre espace d'étude.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            {...register("email")} 
                            type="email" 
                            placeholder="nom@exemple.com" 
                            className="h-11 rounded-xl"
                        />
                        {errors.email && <p className="text-[10px] font-medium text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Link href="#" className="text-xs text-primary hover:underline font-medium">Oublié ?</Link>
                        </div>
                        <Input 
                            id="password" 
                            {...register("password")} 
                            type="password" 
                            className="h-11 rounded-xl"
                        />
                        {errors.password && <p className="text-[10px] font-medium text-destructive">{errors.password.message}</p>}
                    </div>
                </div>
                
                <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion...
                        </>
                    ) : 'Se connecter'}
                </Button>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <Link href="/signup" className="text-primary hover:underline font-bold">
                        Créer un compte gratuitement
                    </Link>
                </p>
            </div>
        </div>
    );
}