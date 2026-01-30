import { Suspense } from 'react';
import { AuthActionHandler } from './components/auth-action-handler';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function AuthActionPageLoading() {
  const bgImage = PlaceHolderImages.find((img) => img.id === 'landing-background');
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          quality={80}
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-zinc-900/70" />
      <div className="relative z-20 w-full max-w-md">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando...</p>
        </div>
      </div>
    </main>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<AuthActionPageLoading />}>
      <AuthActionHandler />
    </Suspense>
  );
}
