// src/app/ai-path/page.tsx
'use client';

import { AiPathGenerator } from "@/components/ai-path-generator";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Sparkles } from "lucide-react";

export default function AiPathPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Générateur de Parcours d'Apprentissage IA</h1>
              <Alert className="bg-primary/5 border-primary/20 max-w-3xl">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold text-sm">Fonctionnalité en cours de déploiement</AlertTitle>
                <AlertDescription className="text-muted-foreground text-xs">
                  Le moteur de génération de parcours personnalisé est actuellement en phase de test. L'accès complet à cet outil sera disponible pour tous les abonnés premium très prochainement.
                </AlertDescription>
              </Alert>
              <p className="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
                Parlez-nous de vos progrès et de vos objectifs. Notre IA élaborera un parcours d'apprentissage personnalisé pour vous aider à réussir.
              </p>
            </div>
            <AiPathGenerator />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
