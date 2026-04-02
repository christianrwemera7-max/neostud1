// src/app/admin/users/page.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldAlert, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FACULTY_NAMES, FacultyName } from '@/lib/constants';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  faculty: FacultyName;
  role: 'student' | 'premium_student' | 'faculty_admin' | 'admin';
  photoURL?: string;
}

const roleOptions: UserProfile['role'][] = ['student', 'premium_student', 'faculty_admin', 'admin'];
const roleBadges: Record<UserProfile['role'], { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
    student: { variant: 'secondary' },
    premium_student: { variant: 'default', className: 'bg-amber-500 text-white hover:bg-amber-600' },
    faculty_admin: { variant: 'outline', className: 'border-primary text-primary' },
    admin: { variant: 'destructive' },
}

const chartConfig = {
  users: {
    label: "Utilisateurs",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function AdminUsersPage() {
  const { userData, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      if (userData?.role !== 'admin') {
        setIsLoading(false);
        return;
      }
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        // Trier les utilisateurs par ordre alphabétique
        usersData.sort((a, b) => a.name.localeCompare(b.name));
        setUsers(usersData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les utilisateurs.' });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUsers();
    }
  }, [userData, authLoading, toast]);
  
  const stats = useMemo(() => {
    const facultyCounts = FACULTY_NAMES.reduce((acc, faculty) => {
      acc[faculty] = 0;
      return acc;
    }, {} as Record<FacultyName, number>);

    users.forEach(user => {
      if (user.faculty && facultyCounts[user.faculty] !== undefined) {
        facultyCounts[user.faculty]++;
      }
    });

    const chartData = Object.entries(facultyCounts).map(([faculty, count]) => ({
      faculty,
      users: count,
    }));
    
    return {
        totalUsers: users.length,
        facultyCounts,
        chartData
    }

  }, [users]);


  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { role: newRole });
      setUsers(prevUsers =>
        prevUsers.map(user => (user.uid === uid ? { ...user, role: newRole } : user))
      );
      toast({ title: 'Succès', description: 'Le rôle de l\'utilisateur a été mis à jour.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La mise à jour du rôle a échoué.' });
    }
  };

  const handleUserDelete = async (userToDelete: UserProfile) => {
    try {
        await deleteDoc(doc(db, "users", userToDelete.uid));
        setUsers(prevUsers => prevUsers.filter(user => user.uid !== userToDelete.uid));
        toast({
            title: "Utilisateur supprimé",
            description: `Le compte de ${userToDelete.name} a été supprimé de Firestore.`,
        });
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
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4"/>
            <CardTitle>Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cette page est réservée aux administrateurs principaux de la plateforme.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion Globale des Utilisateurs</h1>
              <p className="text-muted-foreground mt-2">
                Assignez des rôles, gérez les abonnements et visualisez les statistiques de toute la plateforme.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des Utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Inscrits sur la plateforme</p>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Répartition par Faculté</CardTitle>
                    </CardHeader>
                     <CardContent className="pl-2">
                       <ChartContainer config={chartConfig} className="w-full h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData} margin={{ top: 5, right: 20, left: -20, bottom: -10 }}>
                                    <XAxis dataKey="faculty" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} interval={0} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
                                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
          
            <Card>
                <CardHeader>
                <CardTitle>Liste des Utilisateurs</CardTitle>
                <CardDescription>
                    Gérez les rôles de chaque utilisateur individuellement.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Faculté</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map(user => (
                        <TableRow key={user.uid}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL} alt={user.name} data-ai-hint="person" />
                                <AvatarFallback>{user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>{user.faculty || 'Non spécifiée'}</TableCell>
                        <TableCell>
                            <Select
                            value={user.role}
                            onValueChange={(value: UserProfile['role']) => handleRoleChange(user.uid, value)}
                            disabled={user.uid === userData.uid}
                            >
                            <SelectTrigger className="w-[180px]">
                                 <SelectValue>
                                      <Badge variant={roleBadges[user.role].variant} className={cn("capitalize", roleBadges[user.role].className)}>
                                        {user.role.replace('_', ' ')}
                                    </Badge>
                                 </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map(role => (
                                <SelectItem key={role} value={role} className="capitalize">
                                    {role.replace('_', ' ')}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className="text-right">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" disabled={user.uid === userData.uid}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible et supprimera le compte de <strong>{user.name}</strong> de la base de données.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUserDelete(user)}>Confirmer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
