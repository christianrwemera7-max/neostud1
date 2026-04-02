// src/app/security/page.tsx
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Download, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function SecurityPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion & Sécurité des Contenus</h1>
              <p className="text-muted-foreground mt-2">
                Démonstration des fonctionnalités de protection du contenu de NeoStud.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <CardTitle>Protection du Contenu (Simulation)</CardTitle>
                </div>
                <CardDescription>
                  Les contenus premium sur NeoStud sont protégés pour préserver la propriété intellectuelle des créateurs. Cette section démontre les mesures de protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Contenu Textuel Protégé</h3>
                  <div className="p-4 border rounded-lg bg-muted/50 secure-content">
                    <p className="text-muted-foreground">
                      Ce paragraphe de texte est un exemple de contenu protégé. Sur une véritable application sécurisée, le clic droit, la sélection et la copie de ce texte seraient désactivés pour décourager le plagiat. Un filigrane numérique est également appliqué pour dissuader les captures d'écran. Bien que la protection absolue soit complexe sur le web, ces mesures augmentent considérablement la sécurité de votre contenu.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Image Protégée</h3>
                   <div className="relative w-full max-w-md mx-auto p-4 border rounded-lg bg-muted/50 secure-content">
                    <Image 
                      src="https://picsum.photos/600/400" 
                      alt="Exemple de contenu visuel protégé"
                      width={600}
                      height={400}
                      className="rounded-md secure-content-no-dl"
                      data-ai-hint="library books"
                    />
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Les images et schémas sont également protégés par un filigrane et des mesures techniques pour empêcher le téléchargement direct (clic droit > enregistrer l'image).
                    </p>
                  </div>
                </div>
                
                 <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Gestion des Fichiers</h3>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Download className="h-8 w-8 text-destructive"/>
                    <div>
                        <h4 className="font-medium">Téléchargements Contrôlés</h4>
                        <p className="text-sm text-muted-foreground">
                           Les boutons de téléchargement pour les PDF, vidéos et podcasts ne sont accessibles qu'aux utilisateurs autorisés (abonnés premium), garantissant que seuls les membres peuvent accéder aux fichiers sources.
                        </p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
            
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
