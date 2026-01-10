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
import { CalendarPlus } from "lucide-react";
import { WorkOrderForm } from "./work-order-form";
import { useState, useEffect } from "react";

export function AddWorkOrderButton() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <CalendarPlus className="h-4 w-4" />
        Agendar Inspeção
      </Button>
    );
  }

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <CalendarPlus className="h-4 w-4" />
          Agendar Inspeção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar Nova Inspeção</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para criar uma nova ordem de serviço.
          </DialogDescription>
        </DialogHeader>
        <WorkOrderForm closeDialog={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
