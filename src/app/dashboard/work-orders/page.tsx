'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { WorkOrder, Equipment, Client, User } from '@/lib/data';
import { AddWorkOrderButton } from './components/add-work-order-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

function getStatusVariant(status: WorkOrder['status']) {
  switch (status) {
    case 'Pendente':
      return 'secondary';
    case 'Em Andamento':
      return 'default';
    case 'Concluída':
      return 'outline';
    case 'Cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
}

const ALL_STATUSES = 'Todos';

export default function WorkOrdersPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

  const workOrdersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'workOrders'), orderBy('scheduledDate', 'desc')) : null),
    [firestore]
  );
  const { data: workOrders, isLoading: isLoadingWos } = useCollection<WorkOrder>(workOrdersQuery);

  const equipmentsCollection = useMemoFirebase(() => collection(firestore, 'equipment'), [firestore]);
  const { data: equipments, isLoading: isLoadingEquip } = useCollection<Equipment>(equipmentsCollection);

  const clientsCollection = useMemoFirebase(() => collection(firestore, 'clients'), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);

  const getClientName = (id: string) => clients?.find((c) => c.id === id)?.name || 'N/A';
  const getEquipmentName = (id: string) => equipments?.find((e) => e.id === id)?.name || 'N/A';
  const getInspectorName = (id: string) => users?.find((u) => u.id === id)?.displayName || 'N/A';

  const isLoading = isLoadingWos || isLoadingEquip || isLoadingClients || isLoadingUsers;

  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    return workOrders.filter((wo) => {
      const clientName = getClientName(wo.clientId).toLowerCase();
      const equipmentName = getEquipmentName(wo.equipmentId).toLowerCase();
      const inspectorName = getInspectorName(wo.inspectorId).toLowerCase();
      const displayId = wo.displayId?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      const statusMatch = statusFilter === ALL_STATUSES || wo.status === statusFilter;
      const searchMatch =
        clientName.includes(search) ||
        equipmentName.includes(search) ||
        inspectorName.includes(search) ||
        displayId.includes(search);

      return statusMatch && searchMatch;
    });
  }, [workOrders, searchTerm, statusFilter, clients, equipments, users]);

  const TABS = [ALL_STATUSES, 'Pendente', 'Em Andamento', 'Concluída', 'Cancelada'];

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">Ordens de Serviço</CardTitle>
            <CardDescription>Agende, visualize e gerencie todas as inspeções.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por OS, cliente, equipamento..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AddWorkOrderButton />
          </div>
        </div>
      </CardHeader>

      <Card>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="m-4">
              {TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={statusFilter} className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Inspetor</TableHead>
                    <TableHead className="hidden sm:table-cell">Data Agendada</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    filteredWorkOrders.map((wo) => (
                      <TableRow 
                        key={wo.id} 
                        className="cursor-pointer" 
                        onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                      >
                        <TableCell className="font-medium">{wo.displayId || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{getEquipmentName(wo.equipmentId)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {getClientName(wo.clientId)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {getInspectorName(wo.inspectorId)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(wo.scheduledDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(wo.status)}>{wo.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && filteredWorkOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma ordem de serviço encontrada para os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
      </Card>
    </div>
  );
}
