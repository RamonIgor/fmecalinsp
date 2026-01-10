'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ListChecks,
  Clock,
  TriangleAlert,
  CheckCircle,
  FilePlus2,
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
    { title: 'Inspeções Hoje', value: '0', icon: ListChecks, color: 'text-primary' },
    { title: 'Pendentes', value: '0', icon: Clock, color: 'text-amber-400' },
    { title: 'Alertas Ativos', value: '2', icon: TriangleAlert, color: 'text-red-500' },
    { title: 'Concluídas (Mês)', value: '12', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {user?.displayName?.split(' ')[0] || 'Inspetor'}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">Pronto para começar?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex flex-col items-start gap-2">
              <stat.icon className={`h-7 w-7 ${stat.color}`} />
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
              <p className="text-4xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Iniciar Inspeção</h2>
        <Card>
          <CardContent className="p-4">
            {isLoadingEquipments && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            <ul className="divide-y divide-border">
              {equipments?.map((equipment) => (
                <li key={equipment.id}>
                  <Link href={`/app/inspection/${equipment.id}`} className="flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-muted">
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
                <div className="text-center text-muted-foreground py-8">
                    <HardHat className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-medium">Nenhum equipamento cadastrado.</p>
                    <p className="text-sm">Peça a um administrador para adicionar equipamentos no painel.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
