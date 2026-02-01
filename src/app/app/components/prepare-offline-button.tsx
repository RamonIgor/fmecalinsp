"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DownloadCloud, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { WorkOrder } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { cacheDataForOffline } from "@/lib/offline";

interface PrepareOfflineButtonProps {
    workOrders: WorkOrder[] | null;
}

export function PrepareOfflineButton({ workOrders }: PrepareOfflineButtonProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus(); // Set initial status
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const handlePrepareOffline = async () => {
        const pendingWorkOrders = workOrders?.filter(wo => wo.status === 'Pendente');

        if (!pendingWorkOrders || pendingWorkOrders.length === 0) {
            toast({
                title: "Nenhuma OS para preparar",
                description: "Não há ordens de serviço pendentes para baixar.",
            });
            return;
        }

        if (!isOnline) {
             toast({
                title: "Você está offline",
                description: "É preciso estar online para baixar as ordens de serviço.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // Step 1: Cache all firestore data. This part is already parallel and robust.
            await cacheDataForOffline(firestore, pendingWorkOrders);

            // Step 2: Proactively cache the page routes. This is more robust than cache.addAll().
            const urlsToCache = [
                '/app', // Cache the main inspector page.
                ...pendingWorkOrders.map(wo => `/app/inspection/${wo.id}`)
            ];

            const cache = await caches.open('pages-cache');
            let failedPages = 0;
            
            // This runs all cache operations in parallel and won't fail if a single page fails.
            const cachePromises = urlsToCache.map(url => 
                cache.add(url).catch(err => {
                    console.warn(`Falha ao salvar a página ${url} no cache:`, err);
                    failedPages++;
                })
            );
            
            await Promise.all(cachePromises);

            if (failedPages > 0) {
                 toast({
                    variant: "destructive",
                    title: `Preparação Incompleta`,
                    description: `Os dados foram salvos, mas ${failedPages} de ${urlsToCache.length} páginas não puderam ser cacheadas. Tente novamente.`,
                });
            } else {
                 toast({
                    title: "Pronto para trabalhar offline!",
                    description: `Os dados e as páginas de ${pendingWorkOrders.length} OS foram salvos no dispositivo.`,
                });
            }

        } catch (error) {
            console.error("Error preparing offline data: ", error);
            toast({
                title: "Erro ao preparar para modo offline",
                description: "Não foi possível baixar os dados. Verifique sua conexão e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }
    
    const pendingCount = workOrders?.filter(wo => wo.status === 'Pendente').length ?? 0;

    return (
        <Button onClick={handlePrepareOffline} disabled={loading || pendingCount === 0 || !isOnline} size="lg" className="w-full h-14 text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg">
             {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                <DownloadCloud className="mr-2 h-6 w-6" />
            )}
            {loading ? 'Baixando dados e páginas...' : `Baixar ${pendingCount} OS para Trabalho Offline`}
        </Button>
    );
}
