
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || !firestore) {
      return; // Wait until user and firestore are loaded
    }

    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const role = docSnap.data().role;
          if (role === 'admin') {
            router.replace('/dashboard');
          } else if (role === 'inspector') {
            router.replace('/app');
          } else {
            // Fallback for users without a role
            router.replace('/login'); 
          }
        } else {
          // User exists in Auth but not in Firestore users collection
          router.replace('/login');
        }
      });
    } else {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, firestore]);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando aplicação...</p>
      </div>
    </main>
  );
}
