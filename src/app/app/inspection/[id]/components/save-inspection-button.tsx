"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CloudUpload, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePendingInspection, type OfflineInspection } from "@/lib/offline";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useFirestore } from "@/firebase/provider";
import { writeBatch, doc, collection } from "firebase/firestore";
import type { Inspection } from "@/lib/data";

interface SaveInspectionButtonProps {
    inspectionData: Omit<OfflineInspection, 'localId'>;
}

export function SaveInspectionButton({ inspectionData }: SaveInspectionButtonProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const isOnline = useOnlineStatus();
    const firestore = useFirestore();

    const handleSaveOffline = async () => {
         try {
            console.log('[SaveInspection] Tentando salvar offline...');
            await savePendingInspection(inspectionData);
            
            toast({
                title: "Salvo no Dispositivo!",
                description: "A inspeção foi guardada localmente e será enviada assim que houver internet.",
            });
            
            setTimeout(() => {
                router.push('/app');
            }, 1000);
            
        } catch (error: any) {
            console.error("[SaveInspection] Erro offline:", error);
            toast({
                title: "Falha ao Salvar Offline",
                description: error.message || "Erro desconhecido ao acessar o banco local.",
                variant: "destructive",
            });
        }
    }
    
    const handleSaveOnline = async () => {
        try {
            if (!firestore) throw new Error("Serviço de dados indisponível.");

            console.log('[SaveInspection] Tentando envio direto...');
            const batch = writeBatch(firestore);

            const inspectionRef = doc(collection(firestore, "inspections"));
            const newInspectionData: Inspection = {
                ...(inspectionData as Omit<Inspection, 'id' | 'status'>),
                id: inspectionRef.id,
                status: 'Finalizado'
            };
            batch.set(inspectionRef, newInspectionData);

            const workOrderRef = doc(firestore, "workOrders", inspectionData.workOrderId);
            batch.update(workOrderRef, { status: "Concluída" });

            await batch.commit();

            toast({
                title: "Inspeção Enviada!",
                description: "Dados sincronizados com o servidor com sucesso.",
            });

            setTimeout(() => {
                router.push('/app');
            }, 1000);
            
        } catch (error: any) {
            console.error("[SaveInspection] Erro online:", error);
            toast({
                title: "Conexão Instável",
                description: "Não conseguimos enviar agora. Salvando no dispositivo como segurança...",
            });
            await handleSaveOffline();
        }
    }

    const handleSave = async () => {
        // Validação rápida
        if (!inspectionData.items || inspectionData.items.length === 0) {
            toast({
                title: "Checklist Vazio",
                description: "Responda ao menos um item antes de finalizar.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            if (isOnline) {
                await handleSaveOnline();
            } else {
                await handleSaveOffline();
            }
        } catch (error: any) {
            toast({
                title: "Erro Crítico",
                description: error.message || "Ocorreu um erro inesperado ao salvar.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const canSave = inspectionData.items && inspectionData.items.some(item => item.answer);

    return (
        <Button 
            onClick={handleSave} 
            disabled={loading || !canSave} 
            size="lg" 
            className="w-full h-14 text-lg shadow-lg"
        >
            {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                isOnline ? <CloudUpload className="mr-2 h-6 w-6" /> : <Cloud className="mr-2 h-6 w-6" />
            )}
            {loading 
                ? 'Processando...' 
                : isOnline 
                    ? 'Finalizar e Enviar' 
                    : 'Finalizar e Salvar Offline'
            }
        </Button>
    );
}
