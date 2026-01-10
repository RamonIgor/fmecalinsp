"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { InspectorForm } from "./inspector-form";
import { useState, useEffect } from "react";
import type { Inspector } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export function InspectorActions({ inspector }: { inspector: Inspector }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = () => {
    const inspectorDoc = doc(collection(firestore, "inspectors"), inspector.id);
    deleteDocumentNonBlocking(inspectorDoc);
    toast({
        title: "Inspetor Excluído",
        description: `O inspetor "${inspector.name}" foi excluído.`,
        variant: "destructive"
    });
  }

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
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-500"
            onSelect={handleDelete}
          >
              Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Inspetor</DialogTitle>
          <DialogDescription>
            Atualize os detalhes para {inspector.name}.
          </DialogDescription>
        </DialogHeader>
        {isClient && (
          <InspectorForm
            inspector={inspector}
            closeDialog={() => setIsEditDialogOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
