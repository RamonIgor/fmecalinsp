"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Equipment, Client } from "@/lib/data";
import { EquipmentActions } from "./components/equipment-actions";
import { AddEquipmentButton } from "./components/add-equipment-button";
import { HardDrive, Search, ImageIcon, Factory } from "lucide-react";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection } from "firebase/firestore";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

function getStatusInfo(status: Equipment['status']): { variant: "default" | "secondary" | "destructive" | "outline", text: string } {
  switch (status) {
    case "Operacional":
      return { variant: "default", text: "OPERACIONAL" };
    case "Requer Atenção":
      return { variant: "secondary", text: "ATENÇÃO" };
    case "Fora de Serviço":
      return { variant: "destructive", text: "BLOQUEADO" };
    default:
      return { variant: "outline", text: "N/D" };
  }
}

export default function EquipmentPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const equipmentsCollection = useMemoFirebase(
    () => collection(firestore, "equipment"),
    [firestore]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsCollection);
  
  const clientsCollection = useMemoFirebase(
    () => collection(firestore, "clients"),
    [firestore]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const isLoading = isLoadingEquipments || isLoadingClients;
  
  const getClientName = (clientId?: string) => {
    if (!clients || !clientId) return '';
    return clients.find(c => c.id === clientId)?.name || '';
  };

  const filteredEquipments = useMemo(() => {
    if (!equipments) return [];
    return equipments.filter((equipment) => {
      const search = searchTerm.toLowerCase();
      const clientName = getClientName(equipment.clientId).toLowerCase();
      const nameMatch = equipment.name.toLowerCase().includes(search);
      const tagMatch = equipment.tag.toLowerCase().includes(search);
      const sectorMatch = equipment.sector.toLowerCase().includes(search);

      return nameMatch || tagMatch || sectorMatch || clientName.includes(search);
    });
  }, [equipments, clients, searchTerm]);

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Equipamentos</CardTitle>
              <CardDescription>
                  Visualize, adicione, edite ou remova pontes rolantes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nome, tag, setor ou cliente..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <AddEquipmentButton />
            </div>
        </div>
      </CardHeader>

       {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse h-80 bg-muted"></Card>
            ))}
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEquipments?.map((equipment) => {
            const statusInfo = getStatusInfo(equipment.status);
            const clientName = getClientName(equipment.clientId);
            return (
              <Card key={equipment.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out">
                <div className="relative w-full h-40 bg-muted">
                    {equipment.imageUrl ? (
                        <Image src={equipment.imageUrl} alt={equipment.name} fill className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-zinc-800">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                     {clientName && (
                        <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="flex items-center gap-1.5 bg-black/50 text-white backdrop-blur-sm">
                                <Factory className="h-3 w-3" />
                                {clientName}
                            </Badge>
                        </div>
                    )}
                </div>
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold">{equipment.name}</CardTitle>
                        <Badge variant={statusInfo.variant} className="flex-shrink-0">{statusInfo.text}</Badge>
                    </div>
                    <CardDescription>{equipment.sector}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow text-sm text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">TAG:</span> {equipment.tag}</p>
                    <p><span className="font-semibold text-foreground">Última inspeção:</span> {equipment.lastInspection || 'N/A'}</p>
                </CardContent>
                <CardFooter className="flex justify-end p-2 border-t bg-gray-50 dark:bg-zinc-900/50">
                    <EquipmentActions equipment={equipment} />
                </CardFooter>
              </Card>
            )
        })}
      </div>
       {!isLoading && filteredEquipments?.length === 0 && (
            <div className="text-center text-muted-foreground py-20 rounded-lg border-2 border-dashed">
                <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-semibold">Nenhum equipamento encontrado.</p>
                {searchTerm ? (
                   <p className="text-sm">Tente ajustar sua busca.</p>
                ) : (
                   <p className="text-sm">Clique em "+ Adicionar Equipamento" para começar.</p>
                )}
            </div>
        )}
    </div>
  );
}
