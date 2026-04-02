// src/app/admin/faculty/page.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldAlert, Users, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FacultyName } from '@/lib/constants';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  faculty: FacultyName;
  role: 'student' | 'premium_student' | 'faculty_admin' | 'admin';
  photoURL?: string;
}

const roleOptions: UserProfile['role'][] = ['student', 'premium_student'];
const roleBadges: Record<UserProfile['role'], { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
    student: { variant: 'secondary' },
    premium_student: { variant: 'default', className: 'bg-amber-500 text-white hover:bg-amber-600' },
    faculty_admin: { variant: 'outline', className: 'border-primary text-primary' },
    admin: { variant: 'destructive' },
}

export default function FacultyAdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const facultyName = userData?.faculty;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!facultyName || !(userData?.role === 'admin' || userData?.role === 'faculty_admin')) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'users'), where('faculty', '==', facultyName));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        usersData.sort((a, b) => a.name.localeCompare(b.name));
        setUsers(usersData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les utilisateurs de la faculté.' });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUsers();
    }
  }, [userData, authLoading, toast, facultyName]);
  
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.role === 'premium_student').length;
    return { totalUsers, premiumUsers };
  }, [users]);


  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    if (newRole !== 'student' && newRole !== 'premium_student') {
        toast({ variant: 'destructive', title: 'Action non autorisée', description: 'Vous ne pouvez assigner que les rôles Étudiant ou Étudiant Premium.' });
        return;
    }
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { role: newRole });
      setUsers(prevUsers =>
        prevUsers.map(user => (user.uid === uid ? { ...user, role: newRole } : user))
      );
      toast({ title: 'Succès', description: 'Le statut de l\'utilisateur a été mis à jour.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La mise à jour du statut a échoué.' });
    }
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!(userData?.role === 'admin' || userData?.role === 'faculty_admin')) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="max-w-md text-center p-8">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4"/>
            <CardTitle>Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cette page est réservée aux administrateurs.
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
              <h1 className="text-3xl font-bold tracking-tight">Gestion de la Faculté de {facultyName}</h1>
              <p className="text-muted-foreground mt-2">
                Gérez les abonnements Premium pour les étudiants de votre faculté.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Étudiants dans la faculté</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Abonnés Premium</CardTitle>
                        <Star className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.premiumUsers}</div>
                    </CardContent>
                </Card>
            </div>
          
            <Card>
                <CardHeader>
                <CardTitle>Étudiants de la faculté</CardTitle>
                <CardDescription>
                    Activez ou désactivez le statut Premium pour chaque étudiant.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Statut</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map(user => (
                        <TableRow key={user.uid}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL} alt={user.name} data-ai-hint="person" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Select
                                value={user.role}
                                onValueChange={(value: any) => handleRoleChange(user.uid, value)}
                                disabled={user.uid === userData.uid || !['student', 'premium_student'].includes(user.role)}
                            >
                            <SelectTrigger className="w-[180px]">
                                 <SelectValue>
                                      <Badge variant={roleBadges[user.role]?.variant || 'secondary'} className={cn("capitalize", roleBadges[user.role]?.className)}>
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
