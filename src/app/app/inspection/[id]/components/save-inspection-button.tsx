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
            // DEBUG: Mostrar dados que vão ser salvos
            toast({
                title: "🔍 DEBUG: Iniciando salvamento offline",
                description: `WO: ${inspectionData.workOrderId}, Items: ${inspectionData.items?.length || 0}`,
            });

            console.log('[SaveInspection] Dados da inspeção:', {
                workOrderId: inspectionData.workOrderId,
                equipmentId: inspectionData.equipmentId,
                inspectorId: inspectionData.inspectorId,
                itemsCount: inspectionData.items?.length,
                hasSignature: !!inspectionData.signatureUrl,
                items: inspectionData.items
            });

            await savePendingInspection(inspectionData);
            
            toast({
                title: "✅ Inspeção Salva Localmente!",
                description: "Os dados foram salvos no seu dispositivo e serão enviados quando houver conexão.",
            });
            
            // Aguardar 1 segundo para o toast aparecer antes de redirecionar
            setTimeout(() => {
                router.push('/app');
            }, 1000);
            
        } catch (error) {
            console.error("[SaveInspection] Erro ao salvar inspeção localmente:", error);
            
            // DEBUG: Mostrar erro completo no toast
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorName = error instanceof Error ? error.name : 'Unknown';
            
            toast({
                title: "❌ ERRO AO SALVAR",
                description: `${errorName}: ${errorMessage}`,
                variant: "destructive",
                duration: 10000, // 10 segundos para dar tempo de ler
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

            console.log('[SaveInspection] Inspeção salva online com sucesso!');

            toast({
                title: "✅ Inspeção Enviada!",
                description: "A inspeção foi enviada com sucesso para o servidor.",
            });

            setTimeout(() => {
                router.push('/app');
            }, 1000);
            
        } catch (error: any) {
            console.error("[SaveInspection] Erro ao enviar inspeção online:", error);
            
            toast({
                title: "⚠️ Conexão Perdida",
                description: "Salvando localmente como backup...",
                variant: "default"
            });
            
            await handleSaveOffline();
        }
    }

    const handleSave = async () => {
        // DEBUG: Validação detalhada com toasts
        if (!inspectionData.items || inspectionData.items.length === 0) {
            toast({
                title: "❌ DEBUG: Inspeção Vazia",
                description: `Items: ${inspectionData.items?.length || 0}`,
                variant: "destructive",
                duration: 10000,
            });
            return;
        }

        if (!inspectionData.workOrderId) {
            toast({
                title: "❌ DEBUG: Falta WorkOrderId",
                description: `WO ID: ${inspectionData.workOrderId}`,
                variant: "destructive",
                duration: 10000,
            });
            return;
        }

        if (!inspectionData.equipmentId) {
            toast({
                title: "❌ DEBUG: Falta EquipmentId",
                description: `Equipment ID: ${inspectionData.equipmentId}`,
                variant: "destructive",
                duration: 10000,
            });
            return;
        }

        if (!inspectionData.inspectorId) {
            toast({
                title: "❌ DEBUG: Falta InspectorId",
                description: `Inspector ID: ${inspectionData.inspectorId}`,
                variant: "destructive",
                duration: 10000,
            });
            return;
        }

        // DEBUG: Mostrar status da conexão
        toast({
            title: `🔍 DEBUG: Status Conexão`,
            description: `Online: ${isOnline ? 'SIM' : 'NÃO'}`,
        });

        setLoading(true);
        
        try {
            if (isOnline) {
                await handleSaveOnline();
            } else {
                await handleSaveOffline();
            }
        } catch (error) {
            console.error("[SaveInspection] Erro geral ao salvar:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({
                title: "❌ ERRO GERAL",
                description: errorMessage,
                variant: "destructive",
                duration: 10000,
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