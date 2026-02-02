'use client';

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useFirestore } from "@/firebase/provider";
import { useEffect, useState } from "react";
import { syncWithFirestore, offlineDB } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";
import { useLiveQuery } from "dexie-react-hooks";
import { Badge } from "./ui/badge";
import { CloudSync } from "lucide-react";

export function OfflineSyncManager() {
    const isOnline = useOnlineStatus();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);

    const pendingCount = useLiveQuery(
        () => offlineDB.pendingInspections.count(),
        [], 
        0
    );

    useEffect(() => {
        const trySync = async () => {
            // CRÍTICO: Não tentar sincronizar se estiver offline
            if (!isOnline) {
                console.log('[OfflineSyncManager] Offline - pulando sincronização');
                return;
            }
            
            // Não sincronizar se já estiver sincronizando
            if (isSyncing) {
                console.log('[OfflineSyncManager] Já sincronizando - pulando');
                return;
            }
            
            // Não sincronizar se não houver dados pendentes
            if (!pendingCount || pendingCount === 0) {
                console.log('[OfflineSyncManager] Nenhuma inspeção pendente');
                return;
            }

            console.log(`[OfflineSyncManager] Iniciando sincronização de ${pendingCount} inspeções...`);
            setIsSyncing(true);
            
            try {
                const result = await syncWithFirestore(firestore);
                
                if (result.synced > 0) {
                    toast({
                        title: "Sincronização Automática ✓",
                        description: `${result.synced} inspeção(ões) foram enviadas para o servidor.`,
                    });
                }
                
                if (result.failed > 0) {
                    toast({
                        title: "Sincronização Parcial",
                        description: `${result.synced} enviadas, ${result.failed} falharam. Tentaremos novamente.`,
                        variant: "default",
                    });
                }
            } catch(e) {
                console.error("[OfflineSyncManager] Erro ao sincronizar:", e);
                // Não mostrar toast de erro para não incomodar o usuário
                // A sincronização será tentada novamente depois
            } finally {
                setIsSyncing(false);
            }
        };

        // Tentar sincronizar quando ficar online
        if (isOnline && pendingCount > 0) {
            trySync();
        }

        // Tentar sincronizar a cada 5 minutos se houver dados pendentes
        const intervalId = setInterval(() => {
            if (isOnline && pendingCount > 0 && !isSyncing) {
                trySync();
            }
        }, 5 * 60 * 1000); // 5 minutos

        return () => clearInterval(intervalId);

    }, [isOnline, firestore, toast, isSyncing, pendingCount]);

    // Não mostrar nada se não houver inspeções pendentes
    if (pendingCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-in fade-in">
            <Badge variant="secondary" className="flex items-center gap-2 p-2 text-base shadow-lg border border-border">
                <CloudSync className={`h-5 w-5 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                <span className="text-muted-foreground">
                    {isSyncing 
                        ? `Sincronizando ${pendingCount} inspeção(ões)...`
                        : `${pendingCount} inspeção(ões) aguardando sincronização`
                    }
                </span>
            </Badge>
        </div>
    )
}