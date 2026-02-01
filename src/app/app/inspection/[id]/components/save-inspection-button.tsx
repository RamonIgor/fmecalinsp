"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePendingInspection, type OfflineInspection } from "@/lib/offline";

interface SaveInspectionButtonProps {
    inspectionData: Omit<OfflineInspection, 'localId'>;
}

export function SaveInspectionButton({ inspectionData }: SaveInspectionButtonProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);

        try {
            const result = await savePendingInspection(inspectionData);

            toast({
                title: "Inspeção Salva Localmente",
                description: result.savedIn === 'indexeddb'
                    ? "Dados salvos no armazenamento local do dispositivo."
                    : "Dados salvos em modo de backup. Serão sincronizados quando a conexão estabilizar.",
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
        } finally {
            setLoading(false);
        }
    }

    const canSave = inspectionData.items.some(item => item.answer);

    return (
        <Button onClick={handleSave} disabled={loading || !canSave} size="lg" className="w-full h-14 text-lg">
            {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                <Cloud className="mr-2 h-6 w-6" />
            )}
            Finalizar e Salvar Offline
        </Button>
    );
}