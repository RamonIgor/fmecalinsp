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
            await savePendingInspection(inspectionData);
            toast({
                title: "Inspeção Salva Localmente",
                description: "Os dados foram salvos no seu dispositivo e serão enviados quando houver conexão.",
            });
            router.push('/app');
        } catch (error) {
            console.error("Error saving inspection locally: ", error);
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
            if (!firestore) throw new Error("Firestore is not available.");
            
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

            toast({
                title: "Inspeção Enviada!",
                description: "A inspeção foi enviada com sucesso para o servidor.",
            });

            router.push('/app');
        } catch (error) {
            console.error("Error submitting inspection online: ", error);
            toast({
                title: "Erro ao Enviar",
                description: "Não foi possível conectar ao servidor. A inspeção foi salva localmente como backup.",
                variant: "default"
            });
            // Fallback to offline save if online submission fails
            await handleSaveOffline();
        }
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            if (isOnline) {
                await handleSaveOnline();
            } else {
                await handleSaveOffline();
            }
        } finally {
            // This might not be called if router.push unmounts the component
            // before the promises resolve, but it's good practice.
            setLoading(false);
        }
    }

    const canSave = inspectionData.items.some(item => item.answer);

    return (
        <Button onClick={handleSave} disabled={loading || !canSave} size="lg" className="w-full h-14 text-lg">
            {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                isOnline ? <CloudUpload className="mr-2 h-6 w-6" /> : <Cloud className="mr-2 h-6 w-6" />
            )}
            {isOnline ? 'Finalizar e Enviar' : 'Finalizar e Salvar Offline'}
        </Button>
    );
}
