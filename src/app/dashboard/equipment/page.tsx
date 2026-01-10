"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Equipment } from "@/lib/data";
import { EquipmentActions } from "./components/equipment-actions";
import { AddEquipmentButton } from "./components/add-equipment-button";
import { HardDrive, Search } from "lucide-react";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection } from "firebase/firestore";
import { useCollection } from "@/firebase";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";

function getStatusInfo(status: Equipment['status']): { variant: "default" | "secondary" | "destructive" | "outline", text: string } {
  switch (status) {
    case "Operacional":
      return { variant: "default", text: "OPERACIONAL" };
    case "Requer Atenção":
      return { variant: "secondary", text: "ATENÇÃO" };
    case "Fora de Serviço":
      return { variant: "destructive", text: "BLOQUEADO" };
    default:
      return { variant: "outline", text: "N/D" };
  }
}

export default function EquipmentPage() {
  const firestore = useFirestore();
  const equipmentsCollection = useMemoFirebase(
    () => collection(firestore, "equipment"),
    [firestore]
  );
  const { data: equipments, isLoading } = useCollection<Equipment>(equipmentsCollection);

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Equipamentos</CardTitle>
              <CardDescription>
                  Visualize, adicione, edite ou remova equipamentos de guindaste.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar equipamento..." className="pl-9"/>
                </div>
                {/* TODO: Implement filter dropdowns */}
                <AddEquipmentButton />
            </div>
        </div>
      </CardHeader>

       {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse h-48 bg-muted"></Card>
            ))}
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {equipments?.map((equipment) => {
            const statusInfo = getStatusInfo(equipment.status);
            return (
              <Card key={equipment.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Logo className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-bold text-lg">{equipment.name}</p>
                            <p className="text-sm text-muted-foreground">{equipment.sector}</p>
                        </div>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-semibold text-foreground">Última inspeção:</span> {equipment.lastInspection || 'N/A'}</p>
                        <p><span className="font-semibold text-foreground">Próxima inspeção:</span> N/A</p>
                    </div>
                </CardContent>
                <div className="flex items-center justify-end p-4 pt-0">
                    <EquipmentActions equipment={equipment} />
                </div>
              </Card>
            )
        })}
      </div>
       {!isLoading && equipments?.length === 0 && (
            <div className="text-center text-muted-foreground py-20 rounded-lg border-2 border-dashed">
                <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-semibold">Nenhum equipamento cadastrado.</p>
                <p className="text-sm">Clique em "+ Novo Equipamento" para começar.</p>
            </div>
        )}
    </div>
  );
}
