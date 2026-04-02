// hooks/use-auth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { FacultyName } from '@/lib/constants';

// Définir un type plus spécifique pour les données utilisateur
export interface UserData {
  uid: string;
  name: string;
  email: string;
  studyLevel: string;
  faculty: FacultyName;
  role: 'student' | 'admin' | 'premium_student' | 'faculty_admin';
  photoURL?: string;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
}

export type FeatureFlags = {
  isAssistantPremium: boolean;
  isQuizPremium: boolean;
  isPathPremium: boolean;
  [key: string]: boolean; // Pour un accès dynamique
};

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  featureFlags: FeatureFlags | null;
  setUserData: Dispatch<SetStateAction<UserData | null>>; // Exposer le setter
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  featureFlags: null,
  setUserData: () => {}, // Fonction vide par défaut
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écoute des changements sur les feature flags
    const featureFlagsRef = collection(db, 'feature_flags');
    const unsubscribeFlags = onSnapshot(featureFlagsRef, (snapshot) => {
        const flags = snapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data().isPremium;
            return acc;
        }, {} as Record<string, boolean>);
        setFeatureFlags(flags as FeatureFlags);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          } else {
             // Fallback pour l'environnement de développement si le document n'existe pas encore
             if (process.env.NODE_ENV === 'development') {
                 const devUserData: UserData = {
                    uid: user.uid,
                    name: user.displayName || 'Dev Admin',
                    email: user.email || 'dev@user.com',
                    studyLevel: 'l3',
                    faculty: 'Droit', 
                    role: 'admin',
                    photoURL: user.photoURL || undefined,
                 };
                 setUserData(devUserData);
             } else {
                setUserData(null);
             }
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setUserData(null);
            setLoading(false);
        });
        return () => unsubscribeFirestore();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubscribeFlags();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, featureFlags, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
