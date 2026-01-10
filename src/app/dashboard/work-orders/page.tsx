
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { WorkOrder, Equipment, Client, User } from "@/lib/data";
import { AddWorkOrderButton } from "./components/add-work-order-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, HardHat, Factory } from "lucide-react";

function getStatusVariant(status: WorkOrder['status']) {
  switch (status) {
    case "Pendente":
      return "secondary";
    case "Em Andamento":
      return "default";
    case "Concluída":
      return "outline"; // Success variant can be added
    case "Cancelada":
        return "destructive";
    default:
      return "outline";
  }
}

export default function WorkOrdersPage() {
  const firestore = useFirestore();

  const workOrdersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "workOrders"), orderBy("scheduledDate", "desc")) : null),
    [firestore]
  );
  const { data: workOrders, isLoading: isLoadingWos } = useCollection<WorkOrder>(workOrdersQuery);
  
  const equipmentsCollection = useMemoFirebase(() => collection(firestore, "equipment"), [firestore]);
  const { data: equipments, isLoading: isLoadingEquip } = useCollection<Equipment>(equipmentsCollection);

  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
  
  const usersCollection = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);

  const isLoading = isLoadingWos || isLoadingEquip || isLoadingClients || isLoadingUsers;

  const getClientName = (id: string) => clients?.find(c => c.id === id)?.name || 'N/A';
  const getEquipmentName = (id: string) => equipments?.find(e => e.id === id)?.name || 'N/A';
  const getInspectorName = (id: string) => users?.find(u => u.id === id)?.displayName || 'N/A';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Ordens de Serviço</CardTitle>
          <CardDescription>
            Agende, visualize e gerencie todas as inspeções.
          </CardDescription>
        </div>
        <AddWorkOrderButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead className="hidden lg:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Inspetor</TableHead>
              <TableHead className="hidden sm:table-cell">Data Agendada</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && workOrders?.map((wo) => (
              <TableRow key={wo.id}>
                <TableCell className="font-medium">{getEquipmentName(wo.equipmentId)}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{getClientName(wo.clientId)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{getInspectorName(wo.inspectorId)}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{new Date(wo.scheduledDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(wo.status)}>{wo.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && workOrders?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
