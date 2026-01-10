
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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Equipment } from '@/lib/data';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function InspectorAppPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [greeting, setGreeting] = useState('Olá');

  const equipmentsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'equipment') : null),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const stats = [
    { title: 'Inspeções Hoje', value: '0', icon: ListChecks, color: 'text-primary', borderColor: 'border-primary/50' },
    { title: 'Pendentes', value: '0', icon: Clock, color: 'text-amber-500', borderColor: 'border-amber-500/50' },
    { title: 'Alertas Ativos', value: '2', icon: TriangleAlert, color: 'text-destructive', borderColor: 'border-destructive/50' },
    { title: 'Concluídas (Mês)', value: '12', icon: CheckCircle, color: 'text-status-green', borderColor: 'border-status-green/50' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.displayName?.split(' ')[0] || 'Inspetor'}! 👋
        </h1>
        <p className="text-md text-muted-foreground">Pronto para começar?</p>
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
        <h2 className="text-lg font-semibold mb-3">Iniciar Inspeção</h2>
        <Card className="rounded-2xl">
          <CardContent className="p-2">
            {isLoadingEquipments && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}
            <ul className="divide-y divide-border">
              {equipments?.map((equipment) => (
                <li key={equipment.id}>
                  <Link href={`/app/inspection/${equipment.id}`} className="flex items-center justify-between p-4 rounded-md hover:bg-muted">
                    <div>
                      <p className="font-semibold">{equipment.name}</p>
                      <p className="text-sm text-muted-foreground">{equipment.tag} - {equipment.sector}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
             {!isLoadingEquipments && equipments?.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <HardHat className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 font-semibold">Nenhum equipamento cadastrado.</p>
                    <p className="text-sm">Peça a um administrador para adicionar equipamentos no painel.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
