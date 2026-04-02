import { NeoIcon } from "@/components/neo-icon";
import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background overflow-hidden">
            {/* Partie Gauche : Image et Citation */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <Image 
                        src="https://picsum.photos/seed/education/1200/1200" 
                        alt="Nelson Mandela Citation" 
                        fill 
                        className="object-cover animate-slow-zoom"
                        data-ai-hint="university library"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                
                <div className="relative z-10 max-w-lg space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl">
                            <NeoIcon className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight">NeoStud</span>
                    </div>
                    
                    <div className="space-y-4">
                        <blockquote className="text-4xl font-extrabold text-white leading-tight">
                            "L'éducation est l'arme la plus puissante que vous puissiez utiliser pour changer le monde."
                        </blockquote>
                        <footer className="text-xl text-primary font-medium">
                            — Nelson Mandela
                        </footer>
                    </div>

                    <div className="flex gap-4 pt-8">
                        <div className="h-1 w-12 bg-primary rounded-full" />
                        <div className="h-1 w-4 bg-white/20 rounded-full" />
                        <div className="h-1 w-4 bg-white/20 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Partie Droite : Formulaires */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
                <div className="lg:hidden absolute top-8 flex items-center gap-2">
                    <NeoIcon className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold tracking-tight">NeoStud</span>
                </div>
                
                <div className="w-full max-w-md">
                    {children}
                </div>

                <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} NeoStud Platform. Tous droits réservés.
                </div>
            </div>
        </div>
    );
}