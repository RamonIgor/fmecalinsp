
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
import { UserForm } from "./user-form";
import { useState, useEffect } from "react";
import type { User as UserData } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export function UserActions({ user }: { user: UserData }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = () => {
    // Note: This only deletes the Firestore user document.
    // Deleting the user from Firebase Auth requires admin privileges
    // and is typically done on a server.
    const userDoc = doc(collection(firestore, "users"), user.id);
    deleteDocumentNonBlocking(userDoc);
    toast({
        title: "Usuário Excluído",
        description: `O usuário "${user.displayName}" foi excluído.`,
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
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize os detalhes para {user.displayName}.
          </DialogDescription>
        </DialogHeader>
        {isClient && (
          <UserForm
            user={user}
            closeDialog={() => setIsEditDialogOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
