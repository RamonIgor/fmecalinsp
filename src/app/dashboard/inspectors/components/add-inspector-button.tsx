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
import { InspectorForm } from "./inspector-form";
import { useState, useEffect } from "react";

export function AddInspectorButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <PlusCircle className="h-4 w-4" />
        Adicionar Inspetor
      </Button>
    );
  }

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Adicionar Inspetor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Inspetor</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do novo membro da equipe.
          </DialogDescription>
        </DialogHeader>
        <InspectorForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
