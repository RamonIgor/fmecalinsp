import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'CraneCheck - Inspeções Simplificadas',
  description: 'Uma aplicação full-stack para inspeção técnica de pontes rolantes, com um PWA offline-first para inspetores e um painel de administração web para gerentes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={cn('min-h-screen font-body antialiased', inter.variable, spaceGrotesk.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
