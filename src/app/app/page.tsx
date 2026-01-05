"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Clock, ListChecks, TriangleAlert, FilePlus2, LogOut } from 'lucide-react';
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
    { title: 'Inspeções Hoje', value: '0', icon: ListChecks, color: 'text-primary' },
    { title: 'Pendentes', value: '1', icon: Clock, color: 'text-yellow-500' },
    { title: 'Alertas Ativos', value: '0', icon: TriangleAlert, color: 'text-red-500' },
    { title: 'Concluídas (Mês)', value: '0', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-bold text-foreground">
                {greeting}, base44! 👋
            </h1>
            <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5 text-muted-foreground"/>
            </Button>
        </div>
        <p className="text-muted-foreground">Veja o resumo das suas atividades</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex flex-col items-start gap-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <p className="text-muted-foreground text-sm">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-4">
            <Link href="/app/inspection/equip-1">
              <Card className="bg-foreground text-background hover:bg-foreground/90">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square">
                    <FilePlus2 className="h-8 w-8"/>
                    <span className="font-semibold">Nova Inspeção</span>
                </CardContent>
              </Card>
            </Link>
            <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square">
                    <TriangleAlert className="h-8 w-8 text-yellow-500"/>
                    <span className="font-semibold text-muted-foreground">Reportar Problema</span>
                </CardContent>
            </Card>
        </div>
      </div>

       <div>
        <h2 className="text-lg font-semibold mb-2">Próximas Inspeções</h2>
        <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <Clock className="h-10 w-10 text-muted-foreground"/>
                <p className="text-muted-foreground">Nenhuma inspeção agendada</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
