"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { inspections } from "@/lib/data";

const inspectionStatusData = [
  { status: "Finalizado", count: inspections.filter(i => i.status === 'Finalizado').length, fill: "hsl(var(--chart-2))" },
  { status: "Pendente", count: inspections.filter(i => i.status === 'Pendente').length, fill: "hsl(var(--chart-1))" },
];

const chartConfig = {
  count: {
    label: "Contagem",
  },
  finalizado: {
    label: "Finalizado",
    color: "hsl(var(--chart-2))",
  },
  pendente: {
    label: "Pendente",
    color: "hsl(var(--chart-1))",
  },
};

export function InspectionStatusChart() {
    return (
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral das Inspeções</CardTitle>
            <CardDescription>Status das inspeções recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={inspectionStatusData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--card))'}} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
    )
}
