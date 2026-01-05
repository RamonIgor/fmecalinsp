
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { equipments } from "@/lib/data";
import { InspectionStatusChart } from "./components/inspection-status-chart";
import { RecentActivity } from "./components/recent-activity";

export default function DashboardPage() {
  const totalEquipments = equipments.length;
  const operational = equipments.filter(e => e.status === 'Operacional').length;
  const requiresAttention = equipments.filter(e => e.status === 'Requer Atenção').length;
  const outOfService = equipments.filter(e => e.status === 'Fora de Serviço').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipments}</div>
            <p className="text-xs text-muted-foreground">Total de guindastes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operacional</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operational}</div>
            <p className="text-xs text-muted-foreground">Nenhum problema relatado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requer Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requiresAttention}</div>
            <p className="text-xs text-muted-foreground">Problemas menores encontrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fora de Serviço</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfService}</div>
            <p className="text-xs text-muted-foreground">Falhas críticas detectadas</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InspectionStatusChart />
        <RecentActivity />
      </div>
    </div>
  );
}
