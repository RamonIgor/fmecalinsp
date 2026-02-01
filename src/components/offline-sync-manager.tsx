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
        [], 0 // Default value
    );

    useEffect(() => {
        const trySync = async () => {
            if (isOnline && !isSyncing && (pendingCount ?? 0) > 0) {
                setIsSyncing(true);
                try {
                    const result = await syncWithFirestore(firestore);
                    if (result.synced > 0) {
                        toast({
                            title: "Sincronização Automática",
                            description: `${result.synced} inspeção(ões) pendentes foram enviadas para o servidor.`,
                        });
                    }
                } catch(e) {
                    console.error("Sync process failed:", e);
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        trySync(); // Try syncing when component mounts or dependencies change

        // Optional: set up an interval to retry sync periodically if the tab is open
        const intervalId = setInterval(trySync, 5 * 60 * 1000); // every 5 minutes

        return () => clearInterval(intervalId);

    }, [isOnline, firestore, toast, isSyncing, pendingCount]);

    if (pendingCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-in fade-in">
            <Badge variant="secondary" className="flex items-center gap-2 p-2 text-base shadow-lg border border-border">
                <CloudSync className={`h-5 w-5 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                <span className="text-muted-foreground">{pendingCount} inspeção(ões) pendentes para sincronizar.</span>
            </Badge>
        </div>
    )
}
