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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { AddInspectorButton } from "./components/add-inspector-button";
import { InspectorActions } from "./components/inspector-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Inspector } from "@/lib/data";


export default function InspectorsPage() {
  const firestore = useFirestore();
  const inspectorsCollection = useMemoFirebase(
    () => collection(firestore, "inspectors"),
    [firestore]
  );
  const { data: inspectors, isLoading } = useCollection<Inspector>(inspectorsCollection);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Gerenciamento de Inspetores</CardTitle>
            <CardDescription>
                Visualize, adicione, edite ou remova inspetores da equipe.
            </CardDescription>
        </div>
        <AddInspectorButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">Carregando...</TableCell>
                </TableRow>
            )}
            {inspectors?.map((inspector) => (
              <TableRow key={inspector.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/${inspector.id}/100/100`} alt={inspector.name} />
                      <AvatarFallback>{inspector.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{inspector.name}</span>
                  </div>
                </TableCell>
                <TableCell>{inspector.phone}</TableCell>
                <TableCell className="text-right">
                  <InspectorActions inspector={inspector} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
