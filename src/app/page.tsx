'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Library, Loader2, UserPlus, Sparkles, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { userData, loading } = useAuth();
  
  if (loading) return null;

  return (
    <SidebarProvider>
      <Sidebar><SidebarNav /></Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 page-transition">
           <div className="space-y-10 max-w-7xl mx-auto">
              <Card className="overflow-hidden border-none relative shadow-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent"></div>
                <div className="flex flex-col lg:flex-row items-center p-8 sm:p-16 gap-10 relative">
                  <div className="space-y-8 flex-1 text-center lg:text-left">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold border-none">
                      Plateforme d'excellence académique
                    </Badge>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                      Réussissez vos études avec <span className="text-primary">NeoStud</span>
                    </h1>
                    <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0">
                      Votre compagnon intelligent pour maîtriser votre cursus de {userData?.faculty || 'Droit'} avec des ressources ciblées et des outils IA innovants.
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                      <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/30">
                        <Link href="/courses">Mes Cours <ArrowRight className="ml-2 h-5 w-5" /></Link>
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:block w-full lg:w-[450px]">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl animate-pulse"></div>
                        <Image 
                          src="https://picsum.photos/seed/learn/800/600" 
                          alt="E-learning" 
                          width={800} height={600} 
                          className="rounded-[2.5rem] object-cover shadow-2xl relative z-10 border-4 border-white dark:border-zinc-800" 
                          data-ai-hint="learning student" 
                        />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="p-8">
                    <div className="bg-muted p-4 w-fit rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Mes Cours</CardTitle>
                    <CardDescription className="text-base mt-2">Accédez à vos modules d'apprentissage organisés par promotion.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8"><Button asChild variant="secondary" className="w-full rounded-xl"><Link href="/courses">Voir mes cours</Link></Button></CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="p-8">
                    <div className="bg-muted p-4 w-fit rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Library className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Bibliothèque</CardTitle>
                    <CardDescription className="text-base mt-2">Explorez des milliers de fiches, PDF et vidéos spécialisées.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8"><Button asChild variant="secondary" className="w-full rounded-xl"><Link href="/library">Explorer</Link></Button></CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none bg-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-20"><Sparkles className="h-20 w-20" /></div>
                  <CardHeader className="p-8 relative z-10">
                    <div className="bg-white/20 p-4 w-fit rounded-2xl"><BrainCircuit className="h-8 w-8" /></div>
                    <CardTitle className="text-2xl font-bold mt-4">Outils IA</CardTitle>
                    <CardDescription className="text-white/80 text-base mt-2">Boostez votre productivité avec l'Assistant Neo et les Quiz personnalisés.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 relative z-10">
                    <Button asChild variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 rounded-xl font-bold">
                        <Link href="/ai-path">Découvrir (Bientôt)</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}