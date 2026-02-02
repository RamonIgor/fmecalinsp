'use client';

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useFirestore } from "@/firebase/provider";
import { useEffect, useState } from "react";
import { syncWithFirestore, offlineDB } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";
import { useLiveQuery } from "dexie-react-hooks";
import { Badge } from "./ui/badge";
import { RefreshCw } from "lucide-react";

export function OfflineSyncManager() {
    const isOnline = useOnlineStatus();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);

    // Monitora a contagem de inspeções pendentes no banco local
    const pendingCount = useLiveQuery(
        () => offlineDB.pendingInspections.count(),
        [], 0
    );

    useEffect(() => {
        const trySync = async () => {
            // Só tenta sincronizar se estiver online, não estiver ocupado e houver algo para enviar
            if (isOnline && !isSyncing && (pendingCount ?? 0) > 0) {
                console.log('[SyncManager] Iniciando sincronização automática...');
                setIsSyncing(true);
                try {
                    const result = await syncWithFirestore(firestore);
                    if (result.synced > 0) {
                        toast({
                            title: "Sincronização Concluída",
                            description: `${result.synced} inspeção(ões) pendentes foram enviadas com sucesso.`,
                        });
                    }
                    if (result.failed > 0) {
                        console.warn(`[SyncManager] ${result.failed} falharam ao sincronizar.`);
                    }
                } catch(e) {
                    console.error("[SyncManager] Processo de sincronização falhou:", e);
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        trySync();

        // Tenta novamente a cada 2 minutos se a aba permanecer aberta
        const intervalId = setInterval(trySync, 2 * 60 * 1000);
        return () => clearInterval(intervalId);

    }, [isOnline, firestore, toast, isSyncing, pendingCount]);

    if (!pendingCount || pendingCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right-full">
            <Badge variant="secondary" className="flex items-center gap-2 p-3 text-sm shadow-xl border border-primary/20 bg-background/95 backdrop-blur-md">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold">
                    {isSyncing ? 'Sincronizando...' : `${pendingCount} pendente(s)`}
                </span>
            </Badge>
        </div>
    )
}
