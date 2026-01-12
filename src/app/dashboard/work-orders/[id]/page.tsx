"use client";

import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from "@/firebase";
import { doc, collection } from "firebase/firestore";
import React from "react";
import {
  type WorkOrder,
  type Equipment,
  type Client,
  type User,
} from "@/lib/data";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { WorkOrderActions } from "../components/work-order-actions";

function getStatusVariant(status: WorkOrder["status"]) {
  switch (status) {
    case "Pendente":
      return "secondary";
    case "Em Andamento":
      return "default";
    case "Concluída":
      return "outline";
    case "Cancelada":
      return "destructive";
    default:
      return "outline";
  }
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value || "N/A"}</p>
    </div>
  );
}

export default function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const firestore = useFirestore();
  const router = useRouter();
  const workOrderId = React.use(params).id;

  const workOrderRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "workOrders", workOrderId) : null),
    [firestore, workOrderId]
  );
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useDoc<WorkOrder>(workOrderRef);

  const equipmentId = workOrder?.equipmentId;
  const equipmentRef = useMemoFirebase(
    () => (firestore && equipmentId ? doc(firestore, "equipment", equipmentId) : null),
    [firestore, equipmentId]
  );
  const { data: equipment, isLoading: isLoadingEquipment } = useDoc<Equipment>(equipmentRef);

  const clientId = workOrder?.clientId;
  const clientRef = useMemoFirebase(
    () => (firestore && clientId ? doc(firestore, "clients", clientId) : null),
    [firestore, clientId]
  );
  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  const inspectorId = workOrder?.inspectorId;
  const inspectorRef = useMemoFirebase(
    () => (firestore && inspectorId ? doc(firestore, "users", inspectorId) : null),
    [firestore, inspectorId]
  );
  const { data: inspector, isLoading: isLoadingInspector } = useDoc<User>(inspectorRef);

  const isLoading = isLoadingWorkOrder || isLoadingEquipment || isLoadingClient || isLoadingInspector;

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center">
        <p>Ordem de Serviço não encontrada.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <WorkOrderActions workOrder={workOrder} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              OS: {workOrder.id}
            </CardTitle>
            <Badge variant={getStatusVariant(workOrder.status)}>
              {workOrder.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Equipamento" value={equipment?.name} />
          <DetailItem label="TAG do Equipamento" value={equipment?.tag} />
          <DetailItem label="Setor" value={equipment?.sector} />
          <DetailItem label="Cliente" value={client?.name} />
          <DetailItem label="Inspetor Responsável" value={inspector?.displayName} />
          <DetailItem label="Data Agendada" value={new Date(workOrder.scheduledDate).toLocaleDateString()} />
        </CardContent>
      </Card>
      
      {workOrder.notes && (
        <Card>
            <CardHeader>
                <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{workOrder.notes}</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
