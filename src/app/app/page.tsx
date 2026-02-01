'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ListChecks,
  Clock,
  TriangleAlert,
  CheckCircle,
  HardHat,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react';
import { useMemo } from 'react';
import { useUser } from '@/firebase/provider';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { WorkOrder, Equipment, Client } from '@/lib/data';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function InspectorAppPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const workOrdersQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'workOrders'), where('inspectorId', '==', user.uid), where('status', '==', 'Pendente')) : null),
    [firestore, user]
  );
  const { data: unsortedWorkOrders, isLoading: isLoadingWorkOrders } = useCollection<WorkOrder>(workOrdersQuery);

  const workOrders = useMemo(() => {
    if (!unsortedWorkOrders) return null;
    return [...unsortedWorkOrders].sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    });
  }, [unsortedWorkOrders]);


  const equipmentsCollection = useMemoFirebase(() => collection(firestore, 'equipment'), [firestore]);
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

  const clientsCollection = useMemoFirebase(() => collection(firestore, 'clients'), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const getEquipment = (id: string) => equipments?.find(e => e.id === id);
  const getClient = (id: string) => clients?.find(c => c.id === id);

  const isLoading = isLoadingWorkOrders || isLoadingEquipments || isLoadingClients;

  const stats = [
    { title: 'Inspeções Pendentes', value: workOrders?.length ?? 0, icon: ListChecks, color: 'text-primary', borderColor: 'border-primary/50' },
    { title: 'Pendentes', value: workOrders?.filter(wo => wo.status === 'Pendente').length ?? 0, icon: Clock, color: 'text-amber-500', borderColor: 'border-amber-500/50' },
    { title: 'Alertas Ativos', value: '0', icon: TriangleAlert, color: 'text-destructive', borderColor: 'border-destructive/50' },
    { title: 'Concluídas (Mês)', value: '0', icon: CheckCircle, color: 'text-status-green', borderColor: 'border-status-green/50' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Inspetor'}! 👋
        </h1>
        <p className="text-md text-muted-foreground">Suas tarefas pendentes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`rounded-2xl shadow-sm border-2 ${stat.borderColor}`}>
            <CardContent className="p-4 flex flex-col items-start justify-between h-full gap-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs font-medium">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Minhas Ordens de Serviço</h2>
        <Card className="rounded-2xl">
          <CardContent className="p-2">
            {isLoading && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            <ul className="divide-y divide-border">
              {workOrders?.map((wo) => {
                const equipment = getEquipment(wo.equipmentId);
                const client = getClient(wo.clientId);
                return (
                  <li key={wo.id}>
                    <Link href={`/app/inspection/${wo.id}`} className="block p-4 rounded-md hover:bg-muted">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{equipment?.name}</p>
                                <p className="text-sm text-muted-foreground">{client?.name} - {equipment?.sector}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Badge variant="secondary">{wo.status}</Badge>
                            <span>•</span>
                            <span>Data: {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</span>
                        </div>
                    </Link>
                  </li>
                )
            })}
            </ul>
             {!isLoading && workOrders?.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 font-semibold">Nenhuma ordem de serviço pendente.</p>
                    <p className="text-sm">Você está em dia com suas tarefas!</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
