"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Equipment } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore } from "@/firebase/provider";
import { collection, doc, writeBatch } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";

const componentSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome do componente é obrigatório"),
});

const formSchema = z.object({
  tag: z.string().min(1, "TAG é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  sector: z.string().min(1, "Setor é obrigatório"),
  status: z.enum(["Operacional", "Requer Atenção", "Fora de Serviço"]),
  components: z.array(componentSchema),
});

type EquipmentFormProps = {
  equipment?: Equipment;
  closeDialog: () => void;
};

export function EquipmentForm({ equipment, closeDialog }: EquipmentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag: equipment?.tag || "",
      name: equipment?.name || "",
      sector: equipment?.sector || "",
      status: equipment?.status || "Operacional",
      components: equipment?.components || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { components, ...equipmentData } = values;
    const equipmentCollection = collection(firestore, "equipment");

    if (equipment) {
      // Update logic
      const equipmentDoc = doc(equipmentCollection, equipment.id);
      updateDocumentNonBlocking(equipmentDoc, equipmentData);
      
      const batch = writeBatch(firestore);
      const componentsCollection = collection(equipmentDoc, "components");
      
      // Handle component updates/creations
      components.forEach(comp => {
        const compDoc = comp.id ? doc(componentsCollection, comp.id) : doc(componentsCollection);
        batch.set(compDoc, { name: comp.name });
      });

      // Handle component deletions
      const currentComponentIds = components.map(c => c.id).filter(Boolean);
      equipment.components?.forEach(existingComp => {
        if (!currentComponentIds.includes(existingComp.id)) {
          batch.delete(doc(componentsCollection, existingComp.id));
        }
      });
      await batch.commit();

    } else {
      // Create logic
      const newDocRefPromise = addDocumentNonBlocking(equipmentCollection, equipmentData);
      newDocRefPromise.then(newDocRef => {
        if(newDocRef) {
          const componentsCollection = collection(newDocRef, "components");
          const batch = writeBatch(firestore);
          components.forEach(comp => {
            const compDoc = doc(componentsCollection);
            batch.set(compDoc, { name: comp.name });
          });
          batch.commit();
        }
      })
    }
    
    toast({
      title: `Equipamento ${equipment ? "Atualizado" : "Adicionado"}`,
      description: `O equipamento "${values.name}" foi salvo com sucesso.`,
    });
    closeDialog();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-6">
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TAG</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: PR-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Ponte Rolante 10T" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Produção A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Requer Atenção">
                        Requer Atenção
                      </SelectItem>
                      <SelectItem value="Fora de Serviço">Fora de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Componentes</h3>
              <FormDescription>
                Liste as partes principais do equipamento a serem inspecionadas.
              </FormDescription>
              <div className="space-y-4 mt-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`components.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder={`Componente ${index + 1}`} {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => append({ id: `new-${Date.now()}`, name: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Componente
                </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
