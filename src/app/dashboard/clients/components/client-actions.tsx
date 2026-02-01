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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { ClientForm } from "./client-form";
import { useState } from "react";
import type { Client } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export function ClientActions({ client }: { client: Client }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    const clientDoc = doc(collection(firestore, "clients"), client.id);
    deleteDocumentNonBlocking(clientDoc);
    toast({
        title: "Cliente Excluído",
        description: `O cliente "${client.name}" foi excluído.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize os detalhes para {client.name}.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={client}
            closeDialog={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e excluirá permanentemente o cliente "{client.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDelete}
            >
                Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
