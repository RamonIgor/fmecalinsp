"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ListChecks, TriangleAlert, FilePlus2, LogOut } from 'lucide-react';
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
    { title: 'Pendentes', value: '1', icon: Clock, color: 'text-yellow-400' },
    { title: 'Alertas Ativos', value: '2', icon: TriangleAlert, color: 'text-red-500' },
    { title: 'Concluídas (Mês)', value: '27', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex justify-between items-center mb-1">
            <h1 className="text-3xl font-bold text-foreground">
                {greeting}, base44! 👋
            </h1>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
                <LogOut className="h-6 w-6"/>
            </Button>
        </div>
        <p className="text-lg text-muted-foreground">Este é o resumo das suas atividades.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <Card key={stat.title} className="bg-card/80 border-border/50">
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
              <Card className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <CardContent className="p-5 flex items-center justify-between text-left">
                    <FilePlus2 className="h-10 w-10"/>
                    <span className="text-xl font-bold flex-1 ml-4">Nova Inspeção</span>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-card/80 border-border/50">
                <CardContent className="p-5 flex items-center justify-between text-left text-yellow-400">
                    <TriangleAlert className="h-10 w-10"/>
                    <span className="font-bold text-xl text-muted-foreground flex-1 ml-4">Reportar Problema</span>
                </CardContent>
            </Card>
        </div>
      </div>

       <div>
        <h2 className="text-xl font-semibold mb-3">Próximas Inspeções</h2>
        <Card className="bg-card/80 border-border/50">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <Clock className="h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground font-medium">Nenhuma inspeção agendada para hoje.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
