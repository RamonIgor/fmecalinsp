'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ListChecks,
  TriangleAlert,
  CheckCircle,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { WorkOrder, Equipment, Client, Inspection } from '@/lib/data';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PrepareOfflineButton } from './components/prepare-offline-button';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { useLiveQuery } from 'dexie-react-hooks';
import { offlineDB } from '@/lib/offline';


export default function InspectorAppPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const isOnline = useOnlineStatus();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    // This effect runs once on the client after hydration
    setClientReady(true);
  }, []);

  // --- ONLINE DATA SOURCES ---
  const workOrdersQuery = useMemoFirebase(
    () => (user && isOnline ? query(collection(firestore, 'workOrders'), where('inspectorId', '==', user.uid), where('status', '==', 'Pendente')) : null),
    [firestore, user, isOnline]
  );
  const { data: onlineWorkOrders, isLoading: isLoadingWorkOrders } = useCollection<WorkOrder>(workOrdersQuery);
  
  const inspectionsQuery = useMemoFirebase(
    () => (user && isOnline ? query(collection(firestore, 'inspections'), where('inspectorId', '==', user.uid)) : null),
    [firestore, user, isOnline]
  );
  const { data: onlineInspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsQuery);

  const equipmentsCollection = useMemoFirebase(() => (isOnline ? collection(firestore, 'equipment') : null), [firestore, isOnline]);
  const { data: onlineEquipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

  const clientsCollection = useMemoFirebase(() => (isOnline ? collection(firestore, 'clients') : null), [firestore, isOnline]);
  const { data: onlineClients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
  
  // --- OFFLINE DATA SOURCES (DEXIE) ---
  const offlineWorkOrders = useLiveQuery(
    () => user ? offlineDB.workOrders.where('inspectorId').equals(user.uid).and(wo => wo.status === 'Pendente').toArray() : [],
    [user]
  );
  const offlineEquipments = useLiveQuery(() => offlineDB.equipment.toArray(), []);
  const offlineClients = useLiveQuery(() => offlineDB.clients.toArray(), []);
  const offlineInspections = useLiveQuery(() => user ? offlineDB.pendingInspections.where('inspectorId').equals(user.uid).toArray() : [], [user]);

  // --- SYNC ONLINE DATA TO OFFLINE CACHE ---
  useEffect(() => {
    // This effect keeps the offline cache fresh when the user is online.
    if (isOnline) {
      if (onlineWorkOrders) offlineDB.workOrders.bulkPut(onlineWorkOrders).catch(console.error);
      if (onlineEquipments) offlineDB.equipment.bulkPut(onlineEquipments).catch(console.error);
      if (onlineClients) offlineDB.clients.bulkPut(onlineClients).catch(console.error);
    }
  }, [isOnline, onlineWorkOrders, onlineEquipments, onlineClients]);


  // --- MERGE & DECIDE DATA SOURCE ---
  const pendingWorkOrders = isOnline ? onlineWorkOrders : offlineWorkOrders;
  const inspections = isOnline ? onlineInspections : []; // Completed inspections are not available offline for stats
  const equipments = isOnline ? onlineEquipments : offlineEquipments;
  const clients = isOnline ? onlineClients : offlineClients;
  
  const isLoading = isOnline 
    ? (isLoadingWorkOrders || isLoadingEquipments || isLoadingClients || isLoadingInspections)
    : (offlineWorkOrders === undefined || offlineEquipments === undefined || offlineClients === undefined);

  function getGreeting() {
    if (!clientReady) return 'Olá'; // Placeholder before client-side runs
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  const getDateStatus = (scheduledDate: string): { text: string; variant: 'destructive' | 'default' | 'secondary' } | null => {
      if (!clientReady) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const woDateLocal = new Date(scheduledDate);
      const woDateUTC = new Date(woDateLocal.getUTCFullYear(), woDateLocal.getUTCMonth(), woDateLocal.getUTCDate());
  
      if (woDateUTC < today) {
          return { text: 'Atrasada', variant: 'destructive' };
      }
      if (woDateUTC.getTime() === today.getTime()) {
          return { text: 'Hoje', variant: 'default' };
      }
      return { text: 'Próxima', variant: 'secondary' };
  };

  const sortedWorkOrders = useMemo(() => {
    if (!pendingWorkOrders) return null;
    return [...pendingWorkOrders].sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    });
  }, [pendingWorkOrders]);


  const getEquipment = (id: string) => equipments?.find(e => e.id === id);
  const getClient = (id: string) => clients?.find(c => c.id === id);
  
  const { forToday, overdue, upcoming, completedThisMonth } = useMemo(() => {
    if (!clientReady || !pendingWorkOrders) {
      return { forToday: 0, overdue: 0, upcoming: 0, completedThisMonth: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let forTodayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    for (const wo of pendingWorkOrders) {
      if (wo.scheduledDate) {
        const woDateLocal = new Date(wo.scheduledDate);
        const woDateUTC = new Date(woDateLocal.getUTCFullYear(), woDateLocal.getUTCMonth(), woDateLocal.getUTCDate());
        
        if (woDateUTC < today) {
          overdueCount++;
        } else if (woDateUTC.getTime() === today.getTime()) {
          forTodayCount++;
        } else {
          upcomingCount++;
        }
      }
    }

    const completedThisMonthCount = (inspections || []).filter(i => {
        const inspectionDate = new Date(i.date);
        return inspectionDate.getMonth() === today.getMonth() &&
               inspectionDate.getFullYear() === today.getFullYear();
    }).length;

    return { forToday: forTodayCount, overdue: overdueCount, upcoming: upcomingCount, completedThisMonth: completedThisMonthCount };

  }, [pendingWorkOrders, inspections, clientReady]);


  const stats = [
    { title: 'Para Hoje', value: forToday, icon: CalendarCheck, color: 'text-primary', borderColor: 'border-primary/50' },
    { title: 'Atrasadas', value: overdue, icon: TriangleAlert, color: 'text-destructive', borderColor: 'border-destructive/50' },
    { title: 'Próximas', value: upcoming, icon: ListChecks, color: 'text-blue-500', borderColor: 'border-blue-500/50' },
    { title: 'Concluídas (Mês)', value: completedThisMonth, icon: CheckCircle, color: 'text-status-green', borderColor: 'border-status-green/50' },
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
                 {isLoading || !clientReady ? (
                    <Skeleton className="h-8 w-10" />
                ) : (
                    <p className="text-3xl font-bold">{stat.value}</p>
                )}
                <p className="text-muted-foreground text-xs font-medium">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <PrepareOfflineButton workOrders={sortedWorkOrders} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Minhas Ordens de Serviço Pendentes</h2>
        <Card className="rounded-2xl">
          <CardContent className="p-2">
            {isLoading && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            <ul className="divide-y divide-border">
              {sortedWorkOrders?.map((wo) => {
                const equipment = getEquipment(wo.equipmentId);
                const client = getClient(wo.clientId);
                const dateStatus = wo.scheduledDate ? getDateStatus(wo.scheduledDate) : null;
                return (
                  <li key={wo.id}>
                    <Link href={`/app/inspection/${wo.id}`} className="block p-4 rounded-md hover:bg-muted">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{equipment?.name || 'Carregando...'}</p>
                                <p className="text-sm text-muted-foreground">{client?.name || '...'} - {equipment?.sector || '...'}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            {dateStatus && <Badge variant={dateStatus.variant}>{dateStatus.text}</Badge>}
                            <span>Data: {clientReady ? (wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A') : '...'}</span>
                        </div>
                    </Link>
                  </li>
                )
            })}
            </ul>
             {!isLoading && sortedWorkOrders?.length === 0 && (
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
