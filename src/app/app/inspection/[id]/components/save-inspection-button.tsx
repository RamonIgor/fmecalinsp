"use client";

import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";

export function SaveInspectionButton() {
    const isOnline = useOnlineStatus();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);

        // Simulate network request
        setTimeout(() => {
            if (isOnline) {
                // Simulate direct sync to server
                toast({
                    title: "Inspeção Sincronizada",
                    description: "Os dados da inspeção foram enviados para o servidor.",
                });
            } else {
                // Simulate saving to offline queue
                toast({
                    title: "Inspeção Salva Offline",
                    description: "Os dados foram salvos localmente e serão sincronizados quando houver conexão.",
                });
            }
            setLoading(false);
            // In a real app, you would redirect or clear the form
        }, 1500);
    }

    return (
        <Button onClick={handleSave} disabled={loading} size="lg" className="w-full h-14 text-lg">
             {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                <Send className="mr-2 h-6 w-6" />
            )}
            Finalizar e Salvar Inspeção
        </Button>
    );
}
