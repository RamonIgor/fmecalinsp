"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureDBOpen, offlineDB, type OfflineInspection } from "@/lib/offline";

interface SaveInspectionButtonProps {
    inspectionData: Omit<OfflineInspection, 'localId'>;
}

export function SaveInspectionButton({ inspectionData }: SaveInspectionButtonProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        setDebugInfo(null);

        const logs: string[] = [];

        try {
            // ── INFO 1: ambiente básico ──
            logs.push(`Navigator online: ${navigator.onLine}`);
            logs.push(`User Agent: ${navigator.userAgent}`);
            logs.push(`Storage quota: ${JSON.stringify(await navigator.storage?.estimate())}`);

            // ── INFO 2: testa IndexedDB nativo antes do Dexie ──
            try {
                await new Promise<void>((resolve, reject) => {
                    const req = indexedDB.open('__cranecheck_test__', 1);
                    req.onupgradeneeded = () => { /* cria banco vazio */ };
                    req.onsuccess = () => {
                        req.result.close();
                        indexedDB.deleteDatabase('__cranecheck_test__');
                        resolve();
                    };
                    req.onerror = () => reject(req.error);
                    req.onblocked = () => reject(new Error('IndexedDB bloqueado'));
                });
                logs.push('IndexedDB nativo: OK');
            } catch (nativeErr) {
                logs.push(`IndexedDB nativo FALHOU: ${nativeErr}`);
                setDebugInfo(logs.join('\n'));
                return; // Se o IndexedDB nativo falha, não adianta seguir
            }

            // ── INFO 3: testa o Dexie / ensureDBOpen ──
            try {
                const db = await ensureDBOpen();
                logs.push(`Dexie aberto: OK (nome: ${db.name})`);
            } catch (dexieErr) {
                logs.push(`Dexie FALHOU: ${dexieErr}`);
                setDebugInfo(logs.join('\n'));
                return;
            }

            // ── INFO 4: tenta o add ──
            try {
                const newId = await offlineDB.pendingInspections.add(inspectionData);
                logs.push(`Add bem-sucedido! localId: ${newId}`);
            } catch (addErr) {
                logs.push(`Add FALHOU: [${addErr instanceof Error ? addErr.name : 'Unknown'}] ${addErr}`);
                setDebugInfo(logs.join('\n'));
                return;
            }

            // ── Tudo funcionou ──
            toast({
                title: "Inspeção Salva Localmente",
                description: "Os dados foram salvos no dispositivo e serão sincronizados automaticamente.",
            });

            router.push('/app');

        } catch (error) {
            logs.push(`CATCH GERAL: ${error}`);
            console.error("Error saving inspection locally: ", error);
            toast({
                title: "Erro ao salvar localmente",
                description: error instanceof Error
                    ? error.message
                    : "Não foi possível salvar a inspeção no seu dispositivo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            if (logs.length > 0 && !debugInfo) {
                setDebugInfo(logs.join('\n'));
            }
        }
    }

    const canSave = inspectionData.items.some(item => item.answer);

    return (
        <div className="w-full flex flex-col gap-3">
            <Button onClick={handleSave} disabled={loading || !canSave} size="lg" className="w-full h-14 text-lg">
                {loading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                    <Cloud className="mr-2 h-6 w-6" />
                )}
                Finalizar e Salvar Offline
            </Button>

            {debugInfo && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-900 text-xs whitespace-pre-wrap break-words">
                    <strong>🔧 Debug:</strong>{"\n"}{debugInfo}
                </div>
            )}
        </div>
    );
}