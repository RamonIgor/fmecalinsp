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
import { inspections, equipments } from "@/lib/data";
import type { Inspection } from "@/lib/data";
import { ReportGenerator } from "./components/report-generator";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de Inspeção</CardTitle>
        <CardDescription>
          Navegue e gerencie todos os relatórios de inspeção enviados.
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
            {inspections.map((inspection) => {
              const equipment = equipments.find(e => e.id === inspection.equipmentId);
              return (
                <TableRow key={inspection.id}>
                  <TableCell className="font-medium">{equipment?.name || 'N/A'} ({equipment?.tag || 'N/A'})</TableCell>
                  <TableCell className="hidden sm:table-cell">{inspection.inspectorName}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(inspection.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ReportGenerator inspection={inspection} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
