
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CheckCircle, AlertTriangle, XCircle, CalendarCheck } from "lucide-react";
import { InspectionStatusChart } from "./components/inspection-status-chart";
import { RecentActivity } from "./components/recent-activity";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Equipment, Inspection } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const firestore = useFirestore();
  const equipmentsCollection = useMemoFirebase(
    () => collection(firestore, "equipment"),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);

  const inspectionsCollection = useMemoFirebase(
    () => collection(firestore, "inspections"),
    [firestore]
  );
  const { data: inspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsCollection);

  const isLoading = isLoadingEquipments || isLoadingInspections;

  const operational = equipments?.filter(e => e.status === 'Operacional').length ?? 0;
  const requiresAttention = equipments?.filter(e => e.status === 'Requer Atenção').length ?? 0;
  const outOfService = equipments?.filter(e => e.status === 'Fora de Serviço').length ?? 0;

  const completedThisMonth = inspections?.filter(i => {
    const inspectionDate = new Date(i.date);
    const today = new Date();
    return inspectionDate.getMonth() === today.getMonth() &&
           inspectionDate.getFullYear() === today.getFullYear();
  }).length ?? 0;

  const StatCard = ({ title, value, icon: Icon, description, color, isLoading }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    color: string;
    isLoading: boolean;
  }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/4" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Inspeções no Mês"
          value={completedThisMonth}
          icon={CalendarCheck}
          description={`Total de inspeções concluídas este mês`}
          color="text-primary"
          isLoading={isLoading}
        />
        <StatCard
          title="Operacional"
          value={operational}
          icon={CheckCircle}
          description="Equipamentos sem problemas"
          color="text-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Requer Atenção"
          value={requiresAttention}
          icon={AlertTriangle}
          description="Equipamentos com alertas"
          color="text-yellow-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Fora de Serviço"
          value={outOfService}
          icon={XCircle}
          description="Equipamentos com falhas críticas"
          color="text-red-500"
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InspectionStatusChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
