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
import { ClientForm } from "./client-form";
import { useState, useEffect } from "react";

export function AddClientButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <PlusCircle className="h-4 w-4" />
        Adicionar Cliente
      </Button>
    );
  }

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Adicionar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha o nome do novo cliente (usina).
          </DialogDescription>
        </DialogHeader>
        <ClientForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
