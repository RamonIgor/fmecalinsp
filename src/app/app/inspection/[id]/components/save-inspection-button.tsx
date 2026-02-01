"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { offlineDB, type OfflineInspection } from "@/lib/offline";

interface SaveInspectionButtonProps {
    inspectionData: Omit<OfflineInspection, 'localId'>;
}

export function SaveInspectionButton({ inspectionData }: SaveInspectionButtonProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null); // ← NOVO
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        setDebugError(null); // limpa erro anterior

        try {
            // ── DIAGNÓSTICO 1: testa se o banco abre ──
            let dbReady = false;
            try {
                await offlineDB.open();
                dbReady = true;
            } catch (openErr) {
                setDebugError(`[1] Falha ao abrir DB: ${openErr}`);
                return;
            }

            // ── DIAGNÓSTICO 2: testa se a tabela existe ──
            if (!offlineDB.pendingInspections) {
                setDebugError('[2] Tabela pendingInspections não existe no DB.');
                return;
            }

            // ── DIAGNÓSTICO 3: serializa os dados para garantir que são válidos ──
            let serialized: string;
            try {
                serialized = JSON.stringify(inspectionData);
            } catch (serErr) {
                setDebugError(`[3] Dados não serializáveis: ${serErr}`);
                return;
            }

            // ── DIAGNÓSTICO 4: tenta o add e captura o erro exato ──
            try {
                const newId = await offlineDB.pendingInspections.add(inspectionData);
                console.log('[Offline] Inspeção salva com localId:', newId);
            } catch (addErr: unknown) {
                // Captura o nome e mensagem do erro para mostrar na tela
                const errName = addErr instanceof Error ? addErr.name : 'UnknownError';
                const errMsg = addErr instanceof Error ? addErr.message : String(addErr);
                setDebugError(`[4] Erro no add(): [${errName}] ${errMsg}\n\nDados enviados: ${serialized}`);
                return;
            }

            toast({
                title: "Inspeção Salva Localmente",
                description: "Os dados foram salvos no dispositivo e serão sincronizados automaticamente.",
            });

            router.push('/app');

        } catch (error) {
            const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
            setDebugError(`[CATCH GERAL] ${errMsg}`);
            console.error("Error saving inspection locally: ", error);
            toast({
                title: "Erro ao salvar localmente",
                description: "Não foi possível salvar a inspeção no seu dispositivo. Por favor, tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
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

            {/* ── PAINEL DE DEBUG: aparece apenas se houver erro ── */}
            {debugError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-sm whitespace-pre-wrap break-words">
                    <strong>🔧 Erro (debug):</strong>{"\n"}{debugError}
                </div>
            )}
        </div>
    );
}