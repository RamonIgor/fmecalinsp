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
import type { Client, Equipment, User, WorkOrder } from "@/lib/data";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, addDoc, updateDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório."),
  equipmentId: z.string().min(1, "Equipamento é obrigatório."),
  inspectorId: z.string().min(1, "Inspetor é obrigatório."),
  // Use string for input, then transform to Date
  scheduledDate: z.string({ required_error: "Data de agendamento é obrigatória."})
    .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida."}),
  status: z.enum(["Pendente", "Em Andamento", "Concluída", "Cancelada"]).optional(),
  notes: z.string().optional(),
});

type WorkOrderFormProps = {
  workOrder?: WorkOrder;
  closeDialog: () => void;
};

export function WorkOrderForm({ workOrder, closeDialog }: WorkOrderFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const isEditMode = !!workOrder;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: workOrder?.clientId || "",
      equipmentId: workOrder?.equipmentId || "",
      inspectorId: workOrder?.inspectorId || "",
      notes: workOrder?.notes || "",
      status: workOrder?.status || "Pendente",
      // Handle date formatting for edit and create
      scheduledDate: workOrder?.scheduledDate 
        ? format(parseISO(workOrder.scheduledDate), "yyyy-MM-dd") 
        : format(new Date(), "yyyy-MM-dd"),
    },
  });

  const [selectedClientId, setSelectedClientId] = useState<string | null>(workOrder?.clientId || null);


  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const inspectorsQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("role", "==", "inspector")), [firestore]);
  const { data: inspectors, isLoading: isLoadingInspectors } = useCollection<User>(inspectorsQuery);

  const equipmentsQuery = useMemoFirebase(() => 
    selectedClientId ? query(collection(firestore, "equipment"), where("clientId", "==", selectedClientId)) : null, 
    [firestore, selectedClientId]
  );
  const { data: equipments, isLoading: isLoadingEquipments } = useCollection<Equipment>(equipmentsQuery);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    form.clearErrors();

    const dataToSave = {
      ...values,
      scheduledDate: new Date(values.scheduledDate).toISOString(),
    };

    if (isEditMode) {
      const workOrderDoc = doc(firestore, "workOrders", workOrder.id);
      updateDocumentNonBlocking(workOrderDoc, dataToSave);
      toast({
        title: "Ordem de Serviço Atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    } else {
       try {
        const workOrdersCollection = collection(firestore, "workOrders");
        
        // 1. Create the document to get its ID
        const newDocRef = await addDoc(workOrdersCollection, {
          ...dataToSave,
          createdAt: new Date().toISOString(),
          status: 'Pendente',
        });
        
        // 2. Create the displayId using the new document's ID
        const displayId = `OS-${newDocRef.id.substring(0, 6).toUpperCase()}`;

        // 3. Update the document with the new displayId
        await updateDoc(newDocRef, { displayId: displayId });

        toast({
          title: "Ordem de Serviço Agendada",
          description: `A nova inspeção ${displayId} foi agendada com sucesso.`,
        });

      } catch (error) {
        console.error("Error creating work order: ", error);
        toast({
            title: "Erro ao Agendar",
            description: "Não foi possível criar a ordem de serviço. Tente novamente.",
            variant: "destructive",
        });
        return; // Stop execution on error
      }
    }
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
                      <Input type="date" {...field} />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditMode && (
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
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                <SelectItem value="Concluída">Concluída</SelectItem>
                                <SelectItem value="Cancelada">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Salvar Alterações" : "Agendar Inspeção"}
          </Button>
        </div>
      </form>
    </Form>
  );
}