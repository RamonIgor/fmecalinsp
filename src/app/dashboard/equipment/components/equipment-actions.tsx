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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { useState } from "react";
import type { Equipment } from "@/lib/data";

export function EquipmentActions({ equipment }: { equipment?: Equipment }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!equipment) {
    // This is the "Add New" button in the header
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Equipment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Fill in the details for the new crane equipment.
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm closeDialog={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  // These are the actions for each row in the table
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
          <DialogDescription>
            Update the details for {equipment.name}.
          </DialogDescription>
        </DialogHeader>
        <EquipmentForm
          equipment={equipment}
          closeDialog={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
