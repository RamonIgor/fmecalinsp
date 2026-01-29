
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, limit, orderBy, query } from "firebase/firestore";
import type { WorkOrder, Equipment, User as UserData } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RecentActivity() {
  const firestore = useFirestore();
  
  const workOrdersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "workOrders"), orderBy("createdAt", "desc"), limit(5)) : null),
    [firestore]
  );
  const { data: workOrders, isLoading: isLoadingWos } = useCollection<WorkOrder>(workOrdersQuery);

  const equipmentsCollection = useMemoFirebase(
    () => collection(firestore, "equipment"),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquip } = useCollection<Equipment>(equipmentsCollection);
  
  const usersCollection = useMemoFirebase(
    () => collection(firestore, "users"),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserData>(usersCollection);

  const getEquipmentName = (equipmentId: string) => {
    return equipments?.find(e => e.id === equipmentId)?.name || 'Carregando...';
  };
  
  const getInspectorName = (inspectorId: string) => {
    return users?.find(u => u.id === inspectorId)?.displayName || 'N/A';
  };

  const isLoading = isLoadingWos || isLoadingEquip || isLoadingUsers;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Últimas ordens de serviço criadas.</CardDescription>
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
          {!isLoading && workOrders?.map((wo) => (
            <div key={wo.id} className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-full">
                <CalendarPlus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {getEquipmentName(wo.equipmentId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Inspetor: {getInspectorName(wo.inspectorId)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {wo.createdAt ? formatDistanceToNow(new Date(wo.createdAt), { addSuffix: true, locale: ptBR }) : ''}
              </div>
            </div>
          ))}
          {!isLoading && workOrders?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
