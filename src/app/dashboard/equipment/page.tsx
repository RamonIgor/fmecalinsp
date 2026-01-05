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

function getStatusVariant(status: Equipment['status']) {
  switch (status) {
    case "Operational":
      return "default";
    case "Requires Attention":
      return "secondary";
    case "Out of Service":
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
            <CardTitle>Equipment Management</CardTitle>
            <CardDescription>
                View, add, edit, or remove crane equipment.
            </CardDescription>
        </div>
        <EquipmentActions />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TAG</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Sector</TableHead>
              <TableHead className="hidden sm:table-cell">Last Inspection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell className="font-medium">{equipment.tag}</TableCell>
                <TableCell>{equipment.name}</TableCell>
                <TableCell className="hidden md:table-cell">{equipment.sector}</TableCell>
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
