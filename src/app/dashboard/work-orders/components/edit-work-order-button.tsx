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
import { FilePenLine } from "lucide-react";
import { WorkOrderForm } from "./work-order-form";
import { useState, useEffect } from "react";
import type { WorkOrder } from "@/lib/data";

export function EditWorkOrderButton({ workOrder }: { workOrder: WorkOrder}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-1" disabled>
        <FilePenLine className="h-4 w-4" />
        Editar
      </Button>
    );
  }

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <FilePenLine className="h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da ordem de serviço.
          </DialogDescription>
        </DialogHeader>
        <WorkOrderForm workOrder={workOrder} closeDialog={() => setIsEditDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
