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
            // Cache all firestore data related to the pending work orders
            await cacheDataForOffline(firestore, pendingWorkOrders);

            // Also pre-fetch pages for the PWA cache
            const pagePromises = pendingWorkOrders.map(wo => fetch(`/app/inspection/${wo.id}`));
            await Promise.all([fetch('/app'), ...pagePromises]);

            toast({
                title: "Pronto para trabalhar offline!",
                description: `${pendingWorkOrders.length} ordem(ns) de serviço e seus dados foram salvos no dispositivo.`,
            });
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
            {loading ? 'Baixando dados...' : `Baixar ${pendingCount} OS para Trabalho Offline`}
        </Button>
    );
}
