'use client';

import React from 'react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookCopy,
  Library,
  BrainCircuit,
  Users,
  Settings,
  Bot,
  HelpCircle,
  ShieldCheck,
  UserCog,
  Star,
  Building,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { NeoIcon } from '../neo-icon';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const mainLinks = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/courses', label: 'Mes Cours', icon: BookCopy },
  { href: '/library', label: 'Bibliothèque', icon: Library },
];

const aiLinks = [
  { href: '/ai-path', label: 'Parcours IA', icon: BrainCircuit, upcoming: true },
  { href: '/assistant', label: 'Assistant Neo', icon: Bot, upcoming: true },
  { href: '/quiz', label: 'Quiz Interactifs', icon: HelpCircle, upcoming: true },
];

const communityLinks = [
  { href: '/community', label: 'Communauté', icon: Users },
];

const bottomLinks = [
    { href: '/subscribe', label: 'S\'abonner', icon: Star, className: "text-amber-500 hover:text-amber-600 font-bold" },
    { href: '/security', label: 'Sécurité', icon: ShieldCheck },
    { href: '/settings', label: 'Paramètres', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, userData } = useAuth();
  
  const userAvatar = userData?.photoURL || user?.photoURL;
  const userName = userData?.name || user?.displayName;

  const NavLink = ({ link }: { link: { href: string, label: string, icon: any, upcoming?: boolean, className?: string } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        as={Link}
        href={link.href}
        isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
        tooltip={link.label}
        className={cn(
            "transition-all duration-200 rounded-xl h-10 px-3 flex items-center justify-between",
            link.className,
            (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "hover:bg-sidebar-accent/50"
        )}
      >
        <div className="flex items-center gap-2">
            <link.icon className={cn("h-5 w-5", (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) ? "text-white" : "")} />
            <span className="font-medium">{link.label}</span>
        </div>
        {link.upcoming && (
            <Badge variant="outline" className="text-[8px] h-4 px-1 bg-primary/10 border-primary/20 text-primary uppercase font-bold tracking-tighter">Bientôt</Badge>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 px-2 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary transition-colors">
            <NeoIcon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
          </div>
          <span className="text-xl font-black tracking-tighter text-sidebar-foreground group-hover:text-primary transition-colors">NEOSTUD</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-2">Menu Principal</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {mainLinks.map((link) => <NavLink key={link.href} link={link} />)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-2">Outils IA</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {aiLinks.map((link) => <NavLink key={link.href} link={link} />)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-2">Social</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {communityLinks.map((link) => <NavLink key={link.href} link={link} />)}
          </SidebarMenu>
        </SidebarGroup>

        {userData?.role === 'admin' && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-2">Administration</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                    <SidebarMenuButton as={Link} href="/admin/users" isActive={pathname.startsWith('/admin/users')} className="rounded-xl h-10 px-3">
                        <UserCog className="h-5 w-5" />
                        <span>Gestion Globale</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-background/30 backdrop-blur-sm">
        <SidebarMenu className="mb-6 gap-1">
          {bottomLinks.map((link) => <NavLink key={link.href} link={link} />)}
        </SidebarMenu>
        
        {user ? (
          <div className="flex items-center gap-3 px-3 py-3 bg-sidebar-accent/30 rounded-2xl border border-sidebar-border">
            <Avatar className="h-10 w-10 border border-primary/20 shadow-lg">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden text-sidebar-foreground">
              <p className="font-bold text-sm truncate">{userName || user.email}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] opacity-50 truncate uppercase font-black tracking-wider">
                    {userData?.role.replace('_', ' ')}
                </span>
                {userData?.role === 'premium_student' && <Sparkles className="h-2.5 w-2.5 text-amber-400" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-sidebar-foreground/40 px-3 italic">Session déconnectée</div>
        )}
      </SidebarFooter>
    </>
  );
}