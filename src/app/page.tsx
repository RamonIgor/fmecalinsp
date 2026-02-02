"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Debug log para verificar o estado da autenticação
    console.log('Auth State:', { 
      email: user?.email, 
      role: user?.role, 
      isLoading: isUserLoading,
      hasUser: !!user 
    });

    // Wait until the user's auth and profile state is fully resolved.
    if (isUserLoading) {
      console.log('Still loading user data...');
      return;
    }

    // Once loading is complete, we can make a definitive decision.
    if (user?.role === 'admin') {
      console.log('Redirecting to dashboard (admin)');
      router.replace('/dashboard');
    } else if (user?.role === 'inspector') {
      console.log('Redirecting to app (inspector)');
      router.replace('/app');
    } else {
      // Fallback for no user, or user with no role (invalid state).
      console.log('Redirecting to login (no user or invalid role)');
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando aplicação...</p>
      </div>
    </main>
  );
}