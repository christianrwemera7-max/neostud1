// src/app/test-firebase/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, Database, FolderArchive } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type TestStatus = 'loading' | 'success' | 'error';

interface TestResult {
    status: TestStatus;
    message: string;
    count?: number;
}

const initialTestState: TestResult = { status: 'loading', message: '' };

export default function TestFirebasePage() {
  const [firestoreResult, setFirestoreResult] = useState<TestResult>(initialTestState);
  const [storageResult, setStorageResult] = useState<TestResult>(initialTestState);

  useEffect(() => {
    const runTests = async () => {
      // --- Test 1: Firestore ---
      setFirestoreResult({ status: 'loading', message: 'Test de la connexion à Firestore...' });
      try {
        const querySnapshot = await getDocs(collection(db, 'library'));
        setFirestoreResult({
          status: 'success',
          message: 'Connexion à Firestore réussie.',
          count: querySnapshot.docs.length,
        });
      } catch (e: any) {
        setFirestoreResult({ status: 'error', message: e.message });
      }

      // --- Test 2: Firebase Storage ---
      setStorageResult({ status: 'loading', message: 'Test de la connexion à Firebase Storage...' });
      try {
        const listRef = ref(storage, 'library/');
        const res = await listAll(listRef);
        setStorageResult({
          status: 'success',
          message: 'Connexion à Firebase Storage réussie.',
          count: res.items.length,
        });
      } catch (e: any) {
        setStorageResult({ status: 'error', message: e.message });
      }
    };

    runTests();
  }, []);
  
  const TestCard = ({ title, icon: Icon, testResult }: { title: string, icon: React.ElementType, testResult: TestResult }) => (
    <div className="flex items-start space-x-4">
        <div className="p-3 bg-muted rounded-full">
            <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            {testResult.status === 'loading' && (
                <div className="flex items-center space-x-2 text-blue-600 mt-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Test en cours...</span>
                </div>
            )}
            {testResult.status === 'success' && (
                 <div className="flex items-center space-x-2 text-green-600 mt-2">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                        <span className="font-semibold">Succès !</span>
                        <p className="text-sm">
                            {title === 'Firestore' 
                                ? `${testResult.count} document(s) trouvé(s) dans 'library'.`
                                : `${testResult.count} fichier(s) trouvé(s) dans le dossier 'library/'.`
                            }
                        </p>
                    </div>
                </div>
            )}
            {testResult.status === 'error' && (
                 <div className="text-destructive mt-2">
                   <div className="flex items-center space-x-2 font-semibold">
                     <AlertTriangle className="h-5 w-5" />
                     <span>Échec de la connexion.</span>
                   </div>
                   <code className="mt-2 block text-xs bg-destructive/10 p-2 rounded-md break-all">
                    {testResult.message}
                   </code>
                   <p className="mt-2 text-xs">
                     <b>Action :</b> Vérifiez vos règles de sécurité pour {title} dans la console Firebase.
                   </p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="max-w-3xl mx-auto w-full shadow-lg">
            <CardHeader>
            <CardTitle className="text-2xl">Vérification de la Connexion Firebase</CardTitle>
            <CardDescription>
                Cette page teste la connectivité avec les services Firestore et Firebase Storage. Assurez-vous que vos règles de sécurité sont correctement configurées.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <TestCard title="Firestore" icon={Database} testResult={firestoreResult} />
               <Separator />
               <TestCard title="Firebase Storage" icon={FolderArchive} testResult={storageResult} />
            </CardContent>
        </Card>
    </div>
  );
}
