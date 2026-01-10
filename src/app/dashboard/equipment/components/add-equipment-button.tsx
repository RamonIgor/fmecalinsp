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
import { useState, useEffect } from "react";

export function AddEquipmentButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <PlusCircle className="h-4 w-4" />
        Adicionar Equipamento
      </Button>
    );
  }

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
            Preencha os detalhes para a nova ponte rolante.
          </DialogDescription>
        </DialogHeader>
        <EquipmentForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
