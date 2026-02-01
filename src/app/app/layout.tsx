
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectionStatus } from "@/components/connection-status";
import { Grid, ListChecks, Settings, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { OfflineSyncManager } from "@/components/offline-sync-manager";

const navItems = [
    { href: "/app", icon: Grid, label: "Início" },
    { href: "/app/work-orders", icon: ListChecks, label: "Ordens" },
    { href: "/app/settings", icon: Settings, label: "Ajustes" },
    { isLogout: true, icon: LogOut, label: "Sair" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 bg-background dark:bg-background border-b border-border/20">
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={user.photoURL ?? `https://picsum.photos/seed/${user.uid}/100/100`} alt={user.displayName || "Inspetor"} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex items-center gap-2">
            <ConnectionStatus />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-border/20 bg-card text-card-foreground">
        <nav className="flex items-center justify-around h-full">
            {navItems.map((item) => {
                if ('isLogout' in item && item.isLogout) {
                    return (
                        <button key={item.label} onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground hover:text-primary transition-colors">
                            <item.icon className="h-6 w-6"/>
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    )
                }

                const isActive = pathname === item.href;
                return (
                     <Link key={item.label} href={item.href!} className={cn(
                        "flex flex-col items-center justify-center gap-1 w-full h-full",
                        isActive ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"
                     )}>
                        <item.icon className="h-6 w-6"/>
                        <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
      </footer>
      <OfflineSyncManager />
    </div>
  );
}
