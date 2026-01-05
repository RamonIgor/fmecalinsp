import Link from "next/link";
import { ConnectionStatus } from "@/components/connection-status";
import Logo from "@/components/logo";
import { HardHat, ListChecks, Home } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-card">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
        <Link href="/app" className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary"/>
            <span className="font-headline text-xl font-bold text-primary">CraneCheck</span>
        </Link>
        <ConnectionStatus />
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur-sm">
        <nav className="flex items-center justify-around h-full">
            <Link href="/app" className="flex flex-col items-center justify-center text-primary">
                <Home className="h-6 w-6"/>
                <span className="text-xs">Equipments</span>
            </Link>
            <Link href="#" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <ListChecks className="h-6 w-6"/>
                <span className="text-xs">My Inspections</span>
            </Link>
            <Link href="#" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <HardHat className="h-6 w-6"/>
                <span className="text-xs">Profile</span>
            </Link>
        </nav>
      </footer>
    </div>
  );
}
