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
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);

        try {
            await offlineDB.pendingInspections.add(inspectionData);

            toast({
                title: "Inspeção Salva Localmente",
                description: "Os dados foram salvos no dispositivo e serão sincronizados automaticamente.",
            });
            
            // Redirect to the app home page after saving
            router.push('/app');

        } catch(error) {
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

    // An inspection is saveable if at least one item has been answered.
    const canSave = inspectionData.items.length > 0;

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
