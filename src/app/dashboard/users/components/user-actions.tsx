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
import { UserForm } from "./user-form";
import { useState } from "react";
import type { User as UserData } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export function UserActions({ user }: { user: UserData }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    // Note: This only deletes the Firestore user document.
    // Deleting the user from Firebase Auth requires admin privileges
    // and is typically done on a server. For this app, we assume this is acceptable.
    const userDoc = doc(collection(firestore, "users"), user.id);
    deleteDocumentNonBlocking(userDoc);
    toast({
        title: "Usuário Excluído",
        description: `O registro do usuário "${user.displayName}" foi excluído. A conta de login pode precisar ser removida separadamente.`,
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
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os detalhes para {user.displayName}.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={user}
            closeDialog={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação excluirá o registro do usuário "{user.displayName}" do banco de dados, mas não removerá a conta de login do Firebase Auth.
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
