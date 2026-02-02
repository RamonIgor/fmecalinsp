
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Inspection, Equipment } from "@/lib/data";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

function getStatusVariant(status: Inspection['status']) {
  switch (status) {
    case "Finalizado":
      return "default";
    case "Pendente":
      return "secondary";
    default:
      return "outline";
  }
}

export default function InspectionsPage() {
  const firestore = useFirestore();
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => { setClientReady(true); }, []);

  const inspectionsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, "inspections") : null),
    [firestore]
  );
  const { data: inspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsCollection);

  const equipmentsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, "equipment") : null),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);
  
  const isLoading = isLoadingInspections || isLoadingEquipments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios de Inspeção</CardTitle>
        <CardDescription>
          Navegue e gerencie todos os relatórios de inspeção finalizados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead className="hidden sm:table-cell">Inspetor</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && inspections?.map((inspection) => {
              const equipment = equipments?.find(e => e.id === inspection.equipmentId);
              return (
                <TableRow key={inspection.id}>
                  <TableCell className="font-medium">{equipment?.name || 'N/A'} ({equipment?.tag || 'N/A'})</TableCell>
                  <TableCell className="hidden sm:table-cell">{inspection.inspectorName}</TableCell>
                  <TableCell className="hidden md:table-cell">{clientReady ? new Date(inspection.date).toLocaleDateString('pt-BR') : '...'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/reports/${inspection.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Relatório
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
             {!isLoading && inspections?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">Nenhum relatório de inspeção encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
