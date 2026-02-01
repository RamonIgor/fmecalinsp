"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase, useUser } from "@/firebase/provider";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import type { WorkOrder, Equipment, User as UserData } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RecentActivity() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const workOrdersQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      
      const workOrdersRef = collection(firestore, "workOrders");

      if (user.role === 'admin') {
        return query(
          workOrdersRef, 
          orderBy("scheduledDate", "desc"), 
          limit(5)
        );
      }
      
      return query(
        workOrdersRef,
        where('inspectorId', '==', user.uid),
        orderBy("scheduledDate", "desc"),
        limit(5)
      );
    },
    [firestore, user]
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
        <CardDescription>Últimas ordens de serviço agendadas.</CardDescription>
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
                {wo.scheduledDate ? formatDistanceToNow(new Date(wo.scheduledDate), { addSuffix: true, locale: ptBR }) : 'Data N/A'}
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
