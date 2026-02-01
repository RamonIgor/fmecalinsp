"use client";

import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { collection, doc, writeBatch } from "firebase/firestore";
import type { Inspection } from "@/lib/data";

interface SaveInspectionButtonProps {
    inspectionData: Omit<Inspection, 'id'>;
}

export function SaveInspectionButton({ inspectionData }: SaveInspectionButtonProps) {
    const isOnline = useOnlineStatus();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();

    const handleSave = async () => {
        setLoading(true);

        if (!isOnline) {
             toast({
                title: "Você está offline",
                description: "Por favor, conecte-se à internet para salvar a inspeção.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            const batch = writeBatch(firestore);

            // 1. Create new inspection document
            const inspectionRef = doc(collection(firestore, "inspections"));
            batch.set(inspectionRef, { ...inspectionData, id: inspectionRef.id });

            // 2. Update work order status
            const workOrderRef = doc(firestore, "workOrders", inspectionData.workOrderId);
            batch.update(workOrderRef, { status: "Concluída" });

            await batch.commit();

            toast({
                title: "Inspeção Sincronizada",
                description: "Os dados da inspeção foram enviados para o servidor.",
            });
            
            router.push('/app');

        } catch(error) {
            console.error("Error saving inspection: ", error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar a inspeção. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const canSave = inspectionData.items.length > 0;

    return (
        <Button onClick={handleSave} disabled={loading || !canSave} size="lg" className="w-full h-14 text-lg">
             {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                <Send className="mr-2 h-6 w-6" />
            )}
            Finalizar e Salvar Inspeção
        </Button>
    );
}
