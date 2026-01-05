import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, HardHat, LayoutDashboard } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';

export default function Home() {
  const landingImage = PlaceHolderImages.find(p => p.id === 'landing-background');

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4">
      {landingImage && (
        <Image
          src={landingImage.imageUrl}
          alt={landingImage.description}
          fill
          className="object-cover z-0"
          data-ai-hint={landingImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10"></div>

      <div className="relative z-20 flex flex-col items-center justify-center text-center text-foreground max-w-4xl mx-auto">
        <div className="mb-8">
          <Logo className="h-20 w-auto text-primary" />
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter mb-4">
          CraneCheck
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mb-10">
          Otimizando inspeções de guindastes com tecnologia offline-first para inspetores e análises poderosas para gerentes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/app">
              <HardHat className="mr-2" />
              Abrir App do Inspetor
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2" />
              Acessar Painel do Admin
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          Construído para confiabilidade nos ambientes industriais mais exigentes.
        </p>
      </div>
    </main>
  );
}
