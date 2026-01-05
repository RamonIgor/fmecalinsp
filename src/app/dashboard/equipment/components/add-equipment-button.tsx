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
import { PlusCircle } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { useState } from "react";

export function AddEquipmentButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
        <EquipmentForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
