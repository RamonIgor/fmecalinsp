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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { useState, useEffect } from "react";
import type { Equipment } from "@/lib/data";

export function EquipmentActions({ equipment }: { equipment: Equipment }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (isEditDialogOpen) {
        setIsClient(true);
    } else {
        setIsClient(false);
    }
  }, [isEditDialogOpen]);

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Editar
            </DropdownMenuItem>
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
        {isClient && (
            <EquipmentForm
            equipment={equipment}
            closeDialog={() => setIsEditDialogOpen(false)}
            />
        )}
      </DialogContent>
    </Dialog>
  );
}
