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
            console.log('[SaveInspection] Salvando inspeção offline...', {
                workOrderId: inspectionData.workOrderId,
                itemsCount: inspectionData.items?.length,
                hasSignature: !!inspectionData.signatureUrl
            });

            await savePendingInspection(inspectionData);
            
            toast({
                title: "Inspeção Salva Localmente ✓",
                description: "Os dados foram salvos no seu dispositivo e serão enviados quando houver conexão.",
            });
            
            router.push('/app');
        } catch (error) {
            console.error("[SaveInspection] Erro ao salvar inspeção localmente:", error);
            toast({
                title: "Erro ao salvar localmente",
                description: error instanceof Error
                    ? error.message
                    : "Não foi possível salvar a inspeção no seu dispositivo. Por favor, tente novamente.",
                variant: "destructive"
            });
        }
    }
    
    const handleSaveOnline = async () => {
        try {
            if (!firestore) {
                throw new Error("Firestore não está disponível.");
            }

            console.log('[SaveInspection] Salvando inspeção online...', {
                workOrderId: inspectionData.workOrderId,
                itemsCount: inspectionData.items?.length,
                hasSignature: !!inspectionData.signatureUrl
            });
            
            const batch = writeBatch(firestore);

            // 1. Create a new inspection document
            const inspectionRef = doc(collection(firestore, "inspections"));
            const newInspectionData: Inspection = {
                ...(inspectionData as Omit<Inspection, 'id' | 'status'>),
                id: inspectionRef.id,
                status: 'Finalizado'
            };
            batch.set(inspectionRef, newInspectionData);

            // 2. Update the work order status
            const workOrderRef = doc(firestore, "workOrders", inspectionData.workOrderId);
            batch.update(workOrderRef, { status: "Concluída" });

            // 3. Commit the batch
            await batch.commit();

            console.log('[SaveInspection] Inspeção salva online com sucesso!');

            toast({
                title: "Inspeção Enviada! ✓",
                description: "A inspeção foi enviada com sucesso para o servidor.",
            });

            router.push('/app');
        } catch (error: any) {
            console.error("[SaveInspection] Erro ao enviar inspeção online:", error);
            
            // Se falhar online, tentar salvar offline como backup
            toast({
                title: "Conexão Perdida",
                description: "A inspeção será salva localmente e sincronizada quando houver conexão.",
                variant: "default"
            });
            
            await handleSaveOffline();
        }
    }

    const handleSave = async () => {
        // Validação dos dados antes de salvar
        if (!inspectionData.items || inspectionData.items.length === 0) {
            toast({
                title: "Inspeção Incompleta",
                description: "É necessário responder ao menos um item da inspeção.",
                variant: "destructive"
            });
            return;
        }

        if (!inspectionData.workOrderId || !inspectionData.equipmentId || !inspectionData.inspectorId) {
            toast({
                title: "Dados Faltando",
                description: "Informações essenciais da inspeção estão faltando. Tente recarregar a página.",
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
        } catch (error) {
            console.error("[SaveInspection] Erro geral ao salvar:", error);
            toast({
                title: "Erro ao Salvar",
                description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
                variant: "destructive"
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
            className="w-full h-14 text-lg"
        >
            {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                isOnline ? <CloudUpload className="mr-2 h-6 w-6" /> : <Cloud className="mr-2 h-6 w-6" />
            )}
            {loading 
                ? 'Salvando...' 
                : isOnline 
                    ? 'Finalizar e Enviar' 
                    : 'Finalizar e Salvar Offline'
            }
        </Button>
    );
}