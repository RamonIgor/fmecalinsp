"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, Clock, TriangleAlert, CheckCircle, FilePlus2, HardHat } from 'lucide-react';
import { useState, useEffect } from 'react';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

export default function InspectorAppPage() {
    const [greeting, setGreeting] = useState("Olá");

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

  const stats = [
    { title: 'Inspeções Hoje', value: '3', icon: ListChecks, color: 'text-primary' },
    { title: 'Pendentes', value: '1', icon: Clock, color: 'text-amber-400' },
    { title: 'Alertas Ativos', value: '2', icon: TriangleAlert, color: 'text-red-500' },
    { title: 'Concluídas (Mês)', value: '27', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
            {greeting}, base44! 👋
        </h1>
        <p className="text-lg text-muted-foreground">Este é o resumo das suas atividades.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
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
        <h2 className="text-xl font-semibold mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-4">
            <Link href="/app/inspection/equip-1">
              <Button size="lg" className="w-full h-16 text-lg justify-start p-4">
                <FilePlus2 className="h-8 w-8 mr-4"/>
                <span className="font-bold">Nova Inspeção</span>
              </Button>
            </Link>
            <Button size="lg" variant="secondary" className="w-full h-16 text-lg justify-start p-4">
                <HardHat className="h-8 w-8 mr-4 text-amber-400"/>
                <span className="font-bold">Reportar Problema</span>
            </Button>
        </div>
      </div>

       <div>
        <h2 className="text-xl font-semibold mb-3">Próximas Inspeções</h2>
        <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <Clock className="h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground font-medium">Nenhuma inspeção agendada para hoje.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
