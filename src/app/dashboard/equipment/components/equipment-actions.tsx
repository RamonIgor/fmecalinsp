"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { useState } from "react";
import type { Equipment } from "@/lib/data";

export function EquipmentActions({ equipment }: { equipment?: Equipment }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!equipment) {
    // This is the "Add New" button in the header
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Adicionar Equipamento
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para o novo equipamento de guindaste.
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm closeDialog={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  // These are the actions for each row in the table
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem className="text-red-500">Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Equipamento</DialogTitle>
          <DialogDescription>
            Atualize os detalhes para {equipment.name}.
          </DialogDescription>
        </DialogHeader>
        <EquipmentForm
          equipment={equipment}
          closeDialog={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
