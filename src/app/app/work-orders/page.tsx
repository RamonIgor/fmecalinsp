
'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { WorkOrder, Equipment, Client } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { ListChecks, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function getStatusVariant(status?: WorkOrder['status']) {
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

const ALL_STATUSES = 'Todas';

function WorkOrderList({ workOrders, equipments, clients, isLoading }: { workOrders: WorkOrder[] | null, equipments: Equipment[] | null, clients: Client[] | null, isLoading: boolean }) {
    const router = useRouter();
    const [clientReady, setClientReady] = useState(false);
    useEffect(() => { setClientReady(true); }, []);
    const getEquipment = (id: string) => equipments?.find(e => e.id === id);
    const getClient = (id: string) => clients?.find(c => c.id === id);
    
    if (isLoading) {
        return (
          <div className="space-y-1">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        );
    }
    
    if (!workOrders || workOrders.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <ListChecks className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-semibold">Nenhuma Ordem de Serviço encontrada.</p>
            </div>
        );
    }

    const handleItemClick = (wo: WorkOrder) => {
        // Only pending inspections can be opened.
        if (wo.status === 'Pendente') {
            router.push(`/app/inspection/${wo.id}`);
        }
    }

    return (
        <ul className="divide-y divide-border">
          {workOrders?.map((wo) => {
            const equipment = getEquipment(wo.equipmentId);
            const client = getClient(wo.clientId);
            const isClickable = wo.status === 'Pendente';
            return (
              <li key={wo.id}>
                <div onClick={() => handleItemClick(wo)} className={cn("block p-4", isClickable && "rounded-md hover:bg-muted cursor-pointer")}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{equipment?.name ?? '...'}</p>
                            <p className="text-sm text-muted-foreground">{client?.name ?? '...'} - {equipment?.sector ?? '...'}</p>
                        </div>
                        {isClickable && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <Badge variant={getStatusVariant(wo.status)}>{wo.status}</Badge>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{clientReady ? (wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A') : '...'}</span>
                    </div>
                </div>
              </li>
            )
        })}
        </ul>
    )
}

export default function InspectorWorkOrdersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

    const workOrdersQuery = useMemoFirebase(
        () => (user ? query(
            collection(firestore, 'workOrders'), 
            where('inspectorId', '==', user.uid)
        ) : null),
        [firestore, user]
    );
    const { data: unsortedWorkOrders, isLoading: isLoadingWorkOrders } = useCollection<WorkOrder>(workOrdersQuery);
    
    const workOrders = useMemo(() => {
        if (!unsortedWorkOrders) return null;
        return [...unsortedWorkOrders].sort((a, b) => {
            if (!a.scheduledDate || !b.scheduledDate) return 0;
            return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
        });
    }, [unsortedWorkOrders]);

    const equipmentsCollection = useMemoFirebase(() => collection(firestore, 'equipment'), [firestore]);
    const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

    const clientsCollection = useMemoFirebase(() => collection(firestore, 'clients'), [firestore]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

    const isLoading = isLoadingWorkOrders || isLoadingEquipments || isLoadingClients;

    const TABS = [ALL_STATUSES, 'Pendente', 'Concluída', 'Cancelada'];

    const filteredWorkOrders = useMemo(() => {
        if (!workOrders) return [];
        if (statusFilter === ALL_STATUSES) return workOrders;
        return workOrders.filter(wo => wo.status === statusFilter);
    }, [workOrders, statusFilter]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Minhas Ordens de Serviço</h1>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                     {TABS.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
                </TabsList>
                 <Card className="mt-4">
                    <CardContent className="p-0">
                         <WorkOrderList 
                            workOrders={filteredWorkOrders}
                            equipments={equipments}
                            clients={clients}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
