import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CheckCircle, AlertTriangle, XCircle, HardHat } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { equipments, inspections } from "@/lib/data";

const inspectionStatusData = [
  { status: "Finalizado", count: inspections.filter(i => i.status === 'Finalizado').length, fill: "hsl(var(--chart-2))" },
  { status: "Pendente", count: inspections.filter(i => i.status === 'Pendente').length, fill: "hsl(var(--chart-1))" },
];

const chartConfig = {
  count: {
    label: "Count",
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

export default function DashboardPage() {
  const totalEquipments = equipments.length;
  const operational = equipments.filter(e => e.status === 'Operational').length;
  const requiresAttention = equipments.filter(e => e.status === 'Requires Attention').length;
  const outOfService = equipments.filter(e => e.status === 'Out of Service').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipments</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipments}</div>
            <p className="text-xs text-muted-foreground">Total registered cranes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operational}</div>
            <p className="text-xs text-muted-foreground">No issues reported</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requires Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requiresAttention}</div>
            <p className="text-xs text-muted-foreground">Minor issues found</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfService}</div>
            <p className="text-xs text-muted-foreground">Critical failures detected</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inspections Overview</CardTitle>
            <CardDescription>Status of recent inspections.</CardDescription>
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
        <Card>
           <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest finalized inspections.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspections.slice(0,3).map((inspection) => (
                <div key={inspection.id} className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <HardHat className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {equipments.find(e => e.id === inspection.equipmentId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Inspected by {inspection.inspectorName}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(inspection.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
