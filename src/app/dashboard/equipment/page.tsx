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
import { equipments } from "@/lib/data";
import type { Equipment } from "@/lib/data";
import { EquipmentActions } from "./components/equipment-actions";
import { HardDrive } from "lucide-react";

function getStatusVariant(status: Equipment['status']) {
  switch (status) {
    case "Operacional":
      return "default";
    case "Requer Atenção":
      return "secondary";
    case "Fora de Serviço":
      return "destructive";
    default:
      return "outline";
  }
}

export default function EquipmentPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Gerenciamento de Equipamentos</CardTitle>
            <CardDescription>
                Visualize, adicione, edite ou remova equipamentos de guindaste.
            </CardDescription>
        </div>
        <EquipmentActions />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TAG</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Componentes</TableHead>
              <TableHead className="hidden sm:table-cell">Última Inspeção</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell className="font-medium">{equipment.tag}</TableCell>
                <TableCell>{equipment.name}</TableCell>
                <TableCell className="hidden md:table-cell">
                   <div className="flex items-center gap-2">
                     <HardDrive className="h-4 w-4 text-muted-foreground"/>
                     <span className="text-muted-foreground">{equipment.components?.length || 0}</span>
                   </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{equipment.lastInspection || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(equipment.status)}>{equipment.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <EquipmentActions equipment={equipment} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
