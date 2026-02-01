
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection } from "firebase/firestore";
import type { Inspection } from "@/lib/data";

const chartConfig = {
  count: {
    label: "Contagem",
  },
  finalizado: {
    label: "Finalizado",
    color: "hsl(var(--status-green))",
  },
  pendente: {
    label: "Pendente",
    color: "hsl(var(--primary))",
  },
};

export function InspectionStatusChart() {
    const firestore = useFirestore();
    const inspectionsCollection = useMemoFirebase(
        () => collection(firestore, "inspections"),
        [firestore]
    );
    const { data: inspections, isLoading } = useCollection<Inspection>(inspectionsCollection);

    const inspectionStatusData = inspections ? [
        { status: "Finalizado", count: inspections.filter(i => i.status === 'Finalizado').length, fill: "var(--color-finalizado)" },
        { status: "Pendente", count: inspections.filter(i => i.status === 'Pendente').length, fill: "var(--color-pendente)" },
    ] : [];

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
          <CardHeader>
            <CardTitle>Visão Geral das Inspeções</CardTitle>
            <CardDescription>Status das inspeções recentes.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading && <div className="h-[300px] w-full flex items-center justify-center"><p>Carregando gráfico...</p></div>}
             {!isLoading && (
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inspectionStatusData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} barSize={50}>
                    <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                    <Tooltip cursor={{fill: 'hsl(var(--accent))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </ChartContainer>
            )}
          </CardContent>
        </Card>
    )
}
