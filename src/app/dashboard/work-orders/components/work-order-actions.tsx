"use client";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import type { WorkOrder } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { doc } from "firebase/firestore";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWorkOrderButton } from "./edit-work-order-button";
import { useRouter } from "next/navigation";


export function WorkOrderActions({ workOrder }: { workOrder: WorkOrder }) {
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();


  const handleCancel = () => {
    const workOrderDoc = doc(firestore, "workOrders", workOrder.id);
    updateDocumentNonBlocking(workOrderDoc, { status: "Cancelada" });
    toast({
        title: "Ordem de Serviço Cancelada",
        description: `A OS "${workOrder.displayId}" foi cancelada.`,
    });
    setIsCancelAlertOpen(false);
  }
  
  const handleDelete = () => {
    const workOrderDoc = doc(firestore, "workOrders", workOrder.id);
    deleteDocumentNonBlocking(workOrderDoc);
    toast({
        title: "Ordem de Serviço Excluída",
        description: `A OS "${workOrder.displayId}" foi excluída permanentemente.`,
        variant: "destructive"
    });
    setIsDeleteAlertOpen(false);
    router.push("/dashboard/work-orders");
  }

  const canCancel = workOrder.status === 'Pendente' || workOrder.status === 'Em Andamento';

  return (
    <>
      <div className="flex gap-2">
        <EditWorkOrderButton workOrder={workOrder} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
                disabled={!canCancel}
                onSelect={() => setIsCancelAlertOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar OS
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onSelect={() => setIsDeleteAlertOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir OS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {/* Cancel Alert Dialog */}
      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja cancelar esta Ordem de Serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A OS será marcada como "Cancelada" e não poderá ser iniciada por um inspetor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirmar Cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir esta Ordem de Serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não pode ser desfeita. Todos os dados associados a esta OS serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDelete}
            >
                Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
