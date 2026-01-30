
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the user's auth and profile state is fully resolved.
    if (isUserLoading) {
      return;
    }

    // Once loading is complete, we can make a definitive decision.
    if (user?.role === 'admin') {
      router.replace('/dashboard');
    } else if (user?.role === 'inspector') {
      router.replace('/app');
    } else {
      // Fallback for no user, or user with no role (invalid state).
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
