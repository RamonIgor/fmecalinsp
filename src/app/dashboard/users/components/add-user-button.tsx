
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
import { UserForm } from "./user-form";
import { useState, useEffect } from "react";

export function AddUserButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <PlusCircle className="h-4 w-4" />
        Adicionar Usuário
      </Button>
    );
  }

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do novo membro da equipe.
          </DialogDescription>
        </DialogHeader>
        <UserForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
