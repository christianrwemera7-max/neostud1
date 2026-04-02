// src/app/courses/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { coursesByFaculty } from "@/lib/constants";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { BookCopy, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CoursesPage() {
    const { userData, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Sélectionne tous les cours de la faculté de l'utilisateur
    const courses = (userData?.faculty && coursesByFaculty[userData.faculty]) || [];
    
    const pageTitle = userData ? `Parcours en ${userData.faculty}` : "Parcours d'Études";
    const pageDescription = userData 
        ? `Accédez à l'ensemble des ressources organisées pour votre promotion.`
        : `Connectez-vous pour voir les cours de votre faculté.`;

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
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{pageTitle}</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  {pageDescription}
                </p>
              </div>
              
              {courses.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {courses.map((course) => (
                    <Card key={course.id} className="flex flex-col overflow-hidden relative group transition-all hover:shadow-xl hover:-translate-y-1 duration-300 border-primary/10">
                      <div className={cn("absolute inset-0 bg-gradient-to-br transition-opacity opacity-5 group-hover:opacity-15", course.className)} />
                      <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] overflow-hidden">
                        <Image src={course.image} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={course.aiHint} />
                      </div>
                      <CardContent className="p-5 sm:p-6 flex-grow relative space-y-4">
                        <div>
                          <CardTitle className="text-xl sm:text-2xl mb-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                          <CardDescription className="text-sm sm:text-base leading-relaxed line-clamp-2">{course.description}</CardDescription>
                        </div>
                        
                        <Separator className="opacity-50" />

                        <div className="space-y-3">
                            <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <BookCopy className="h-4 w-4 text-primary" />
                              Matières principales
                            </h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                              {course.subjects.slice(0, 8).map(subject => (
                                <li key={subject} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                  <span className="truncate">{subject}</span>
                                </li>
                              ))}
                              {course.subjects.length > 8 && (
                                <li className="text-xs sm:text-sm text-primary font-medium italic">
                                  + {course.subjects.length - 8} autres matières...
                                </li>
                              )}
                            </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="p-5 sm:p-6 pt-0 mt-auto relative">
                        <Button asChild className="w-full rounded-xl py-6 text-base font-semibold shadow-md">
                          <Link href={`/library?courseId=${course.id}`}>Accéder aux ressources</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center p-12 sm:p-20 border-dashed bg-muted/20">
                  <CardContent className="space-y-4">
                    <BookCopy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl sm:text-2xl font-bold">Aucun parcours trouvé</h3>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                      {userData ? `Aucun cours n'est actuellement configuré pour la faculté de ${userData.faculty}.` : 'Veuillez vous connecter pour voir vos cours.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
