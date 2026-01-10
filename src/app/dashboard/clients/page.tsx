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
import { useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { AddClientButton } from "./components/add-client-button";
import { ClientActions } from "./components/client-actions";
import type { Client } from "@/lib/data";

export default function ClientsPage() {
  const firestore = useFirestore();
  const clientsCollection = useMemoFirebase(
    () => collection(firestore, "clients"),
    [firestore]
  );
  const { data: clients, isLoading } = useCollection<Client>(clientsCollection);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Gerenciamento de Clientes</CardTitle>
            <CardDescription>
                Visualize, adicione, edite ou remova clientes (usinas).
            </CardDescription>
        </div>
        <AddClientButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Endereço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Carregando...</TableCell>
              </TableRow>
            )}
            {clients?.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  {client.name}
                </TableCell>
                <TableCell className="hidden md:table-cell">{client.address}</TableCell>
                <TableCell className="text-right">
                  <ClientActions client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
