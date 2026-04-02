// src/components/layout/header.tsx
'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LifeBuoy, LogIn, LogOut, Settings, UserPlus, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { SearchDialog } from "../search-dialog";
import { Badge } from "../ui/badge";

export function Header() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const userAvatar = userData?.photoURL || user?.photoURL;
  const userName = userData?.name || user?.displayName;
  const isPremium = userData?.role === 'premium_student' || userData?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
        <h1 className="text-xl font-black tracking-tighter text-primary hidden sm:block">NEOSTUD</h1>
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center justify-end gap-2 sm:gap-4">
        <SearchDialog />
        
        {isPremium && (
            <Badge variant="outline" className="hidden lg:flex gap-1.5 border-primary/30 bg-primary/5 text-primary font-bold px-3 py-1 rounded-full animate-in fade-in slide-in-from-right-2">
                <Sparkles className="h-3 w-3" />
                Premium
            </Badge>
        )}

        <Button variant="ghost" size="icon" className="rounded-full hidden xs:flex hover:bg-primary/10 hover:text-primary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all p-0 overflow-hidden">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userAvatar || `https://picsum.photos/100/100?random=${user.uid}`} alt={userName || "User"} data-ai-hint="person" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl border-none p-2 bg-white dark:bg-zinc-900 mt-2">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-bold leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <div className="p-1">
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2.5">
                    <Link href="/settings">
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Paramètres</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5">
                    <LifeBuoy className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Support</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="mx-2 opacity-50" />
              <div className="p-1">
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2.5">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Se déconnecter</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden xs:flex rounded-full">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild className="rounded-full shadow-lg shadow-primary/20 px-6">
              <Link href="/signup">S'inscrire</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
