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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { useState, useEffect } from "react";
import type { Equipment, EquipmentComponent } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc, getDocs } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export function EquipmentActions({ equipment }: { equipment: Equipment }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [components, setComponents] = useState<EquipmentComponent[]>([]);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (isEditDialogOpen) {
      const fetchComponents = async () => {
        const componentsCollection = collection(firestore, "equipment", equipment.id, "components");
        const componentsSnapshot = await getDocs(componentsCollection);
        const componentsList = componentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentComponent));
        setComponents(componentsList);
      };
      fetchComponents();
    }
  }, [isEditDialogOpen, firestore, equipment.id]);

  const handleDelete = () => {
    const equipmentDoc = doc(collection(firestore, "equipment"), equipment.id);
    deleteDocumentNonBlocking(equipmentDoc);
    toast({
        title: "Equipamento Excluído",
        description: `O equipamento "${equipment.name}" foi excluído.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
  }

  const equipmentWithComponents = { ...equipment, components };

  return (
    <>
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
                className="text-red-500 focus:text-red-500"
                onSelect={() => setIsDeleteDialogOpen(true)}
            >
                Excluir
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Equipamento</DialogTitle>
                    <DialogDescription>
                    Atualize os detalhes para {equipment.name}.
                    </DialogDescription>
                </DialogHeader>
                <EquipmentForm
                    equipment={equipmentWithComponents}
                    closeDialog={() => setIsEditDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita e excluirá permanentemente o equipamento "{equipment.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDelete}>
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
