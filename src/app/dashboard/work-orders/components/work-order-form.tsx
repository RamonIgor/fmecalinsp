"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Client, Equipment, User } from "@/lib/data";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const formSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório."),
  equipmentId: z.string().min(1, "Equipamento é obrigatório."),
  inspectorId: z.string().min(1, "Inspetor é obrigatório."),
  // Use string for input, then transform to Date
  scheduledDate: z.string({ required_error: "Data de agendamento é obrigatória."})
    .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida."}),
  notes: z.string().optional(),
});

type WorkOrderFormProps = {
  closeDialog: () => void;
};

export function WorkOrderForm({ closeDialog }: WorkOrderFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      // Set default to today in YYYY-MM-DD format
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const inspectorsQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("role", "==", "inspector")), [firestore]);
  const { data: inspectors, isLoading: isLoadingInspectors } = useCollection<User>(inspectorsQuery);

  const equipmentsQuery = useMemoFirebase(() => 
    selectedClientId ? query(collection(firestore, "equipment"), where("clientId", "==", selectedClientId)) : null, 
    [firestore, selectedClientId]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsQuery);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const workOrdersCollection = collection(firestore, "workOrders");
    const dataToSave = {
      ...values,
      // Convert string back to ISO string for Firestore
      scheduledDate: new Date(values.scheduledDate).toISOString(),
      status: 'Pendente',
    };
    addDocumentNonBlocking(workOrdersCollection, dataToSave);
    
    toast({
      title: "Ordem de Serviço Agendada",
      description: "A nova inspeção foi agendada com sucesso.",
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
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedClientId(value);
                    form.resetField("equipmentId");
                  }} defaultValue={field.value} disabled={isLoadingClients}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione o cliente"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || isLoadingEquipments}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingEquipments ? "Carregando..." :
                          !selectedClientId ? "Selecione um cliente primeiro" : 
                          "Selecione o equipamento"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipments?.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.tag})</SelectItem>
                      ))}
                      {!isLoadingEquipments && equipments?.length === 0 && selectedClientId && (
                        <div className="p-2 text-sm text-muted-foreground">Nenhum equipamento para este cliente.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inspectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atribuir ao Inspetor</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingInspectors}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingInspectors ? "Carregando..." : "Selecione o inspetor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors?.map(ins => (
                        <SelectItem key={ins.id} value={ins.id}>{ins.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Agendamento</FormLabel>
                   <FormControl>
                      <Input type="date" {...field} className="w-[240px]" />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instruções especiais, detalhes de contato no local, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button type="submit">Agendar Inspeção</Button>
        </div>
      </form>
    </Form>
  );
}
