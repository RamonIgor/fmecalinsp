
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Package2,
  Settings,
  ListChecks,
  Wrench,
  ChevronDown,
  Users,
  Factory,
  LogOut,
  Loader2,
  CalendarPlus,
  FileText,
  PanelLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Painel" },
    { href: "/dashboard/work-orders", icon: CalendarPlus, label: "Ordens de Serviço" },
    { href: "/dashboard/inspections", icon: FileText, label: "Relatórios" },
    { href: "/dashboard/clients", icon: Factory, label: "Clientes" },
    { href: "/dashboard/equipment", icon: Wrench, label: "Equipamentos" },
    { href: "/dashboard/users", icon: Users, label: "Usuários" },
];

function UserNav() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const handleLogout = async () => {
        if (!auth) return;
        await auth.signOut();
        router.push('/login');
    };

    if (isUserLoading) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
            </div>
        )
    }

    return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 w-9 md:h-auto md:w-auto">
                <Avatar className="h-9 w-9">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} alt="Gerente" />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.displayName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block"/>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <p>Minha Conta</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);


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
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-zinc-950">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-secondary sm:flex">
            <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
                <Logo className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold text-white">CraneCheck</span>
            </div>
            <nav className="flex flex-col gap-2 p-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-primary -ml-1 pl-4"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>

        <div className="flex flex-col w-full sm:pl-64">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 sm:justify-end sm:px-6">
                 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs bg-secondary border-r-0 text-secondary-foreground">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <nav className="grid gap-6 text-lg font-medium">
                        <div className="flex h-16 items-center gap-2 px-0 border-b border-sidebar-border">
                            <Logo className="h-8 w-8 text-primary" />
                            <span className="font-headline text-2xl font-bold">CraneCheck</span>
                        </div>
                         {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsSheetOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-2.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                                        isActive && "bg-sidebar-accent text-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                         })}
                        </nav>
                    </SheetContent>
                </Sheet>
                <UserNav />
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-gray-100 dark:bg-background">
                {children}
            </main>
        </div>
    </div>
  );
}
