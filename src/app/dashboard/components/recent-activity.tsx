
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HardHat } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, limit, orderBy, query } from "firebase/firestore";
import type { Inspection, Equipment } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const firestore = useFirestore();
  
  const inspectionsQuery = useMemoFirebase(
    () => query(collection(firestore, "inspections"), orderBy("date", "desc"), limit(5)),
    [firestore]
  );
  const { data: inspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsQuery);

  const equipmentsCollection = useMemoFirebase(
    () => collection(firestore, "equipment"),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

  const getEquipmentName = (equipmentId: string) => {
    if (!equipments) return 'Carregando...';
    return equipments.find(e => e.id === equipmentId)?.name || 'Desconhecido';
  };

  const isLoading = isLoadingInspections || isLoadingEquipments;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Últimas inspeções finalizadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
              ))}
            </>
          )}
          {!isLoading && inspections?.map((inspection) => (
            <div key={inspection.id} className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-full">
                <HardHat className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {getEquipmentName(inspection.equipmentId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Inspetor: {inspection.inspectorName}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(inspection.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          ))}
          {!isLoading && inspections?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
