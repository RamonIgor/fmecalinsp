'use client';

import { useDoc } from "@/firebase/firestore/use-doc";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc } from "firebase/firestore";
import React from "react";
import {
  type Inspection,
  type WorkOrder,
  type Equipment,
  type Client,
} from "@/lib/data";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { EditableReport } from "./components/editable-report";

export default function ReportPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const router = useRouter();
  const inspectionId = React.use(params).id;

  const inspectionRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "inspections", inspectionId) : null),
    [firestore, inspectionId]
  );
  const { data: inspection, isLoading: isLoadingInspection } = useDoc<Inspection>(inspectionRef);

  const workOrderId = inspection?.workOrderId;
  const workOrderRef = useMemoFirebase(
    () => (firestore && workOrderId ? doc(firestore, "workOrders", workOrderId) : null),
    [firestore, workOrderId]
  );
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useDoc<WorkOrder>(workOrderRef);

  const equipmentId = inspection?.equipmentId;
  const equipmentRef = useMemoFirebase(
    () => (firestore && equipmentId ? doc(firestore, "equipment", equipmentId) : null),
    [firestore, equipmentId]
  );
  const { data: equipment, isLoading: isLoadingEquipment } = useDoc<Equipment>(equipmentRef);

  const clientId = equipment?.clientId;
  const clientRef = useMemoFirebase(
    () => (firestore && clientId ? doc(firestore, "clients", clientId) : null),
    [firestore, clientId]
  );
  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  const isLoading = isLoadingInspection || isLoadingWorkOrder || isLoadingEquipment || isLoadingClient;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados do relatório...</p>
      </div>
    );
  }

  if (!inspection || !workOrder || !equipment || !client) {
    return (
      <div className="text-center">
        <p>Dados da inspeção não encontrados.</p>
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
      <div className="flex items-center justify-between report-page-header">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Relatório de Inspeção Editável</h1>
            <p className="text-muted-foreground">Ajuste o conteúdo e imprima o relatório final.</p>
          </div>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>
      <EditableReport
        inspection={inspection}
        workOrder={workOrder}
        equipment={equipment}
        client={client}
      />
    </div>
  );
}
