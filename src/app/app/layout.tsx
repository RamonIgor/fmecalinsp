import Link from "next/link";
import { ConnectionStatus } from "@/components/connection-status";
import Logo from "@/components/logo";
import { Grid, ListChecks, Wrench, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-border/20 bg-card text-card-foreground">
        <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/seed/inspector/100/100" alt="Inspetor" />
                <AvatarFallback>I</AvatarFallback>
            </Avatar>
            <span className="font-bold text-lg text-foreground">base44</span>
        </div>
        <div className="flex items-center gap-2">
            <ConnectionStatus />
             <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5 text-muted-foreground"/>
            </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-border/20 bg-card text-card-foreground">
        <nav className="flex items-center justify-around h-full">
            <Link href="/app" className="flex flex-col items-center justify-center text-primary gap-1">
                <Grid className="h-6 w-6"/>
                <span className="text-xs font-medium">Início</span>
            </Link>
            <Link href="#" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors gap-1">
                <ListChecks className="h-6 w-6"/>
                <span className="text-xs">Inspeções</span>
            </Link>
            <Link href="#" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors gap-1">
                <Wrench className="h-6 w-6"/>
                <span className="text-xs">Ativos</span>
            </Link>
        </nav>
      </footer>
    </div>
  );
}
