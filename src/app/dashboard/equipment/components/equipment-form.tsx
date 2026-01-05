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

const formSchema = z.object({
  tag: z.string().min(1, "TAG é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  sector: z.string().min(1, "Setor é obrigatório"),
  status: z.enum(["Operacional", "Requer Atenção", "Fora de Serviço"]),
});

type EquipmentFormProps = {
  equipment?: Equipment;
  closeDialog: () => void;
};

export function EquipmentForm({ equipment, closeDialog }: EquipmentFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag: equipment?.tag || "",
      name: equipment?.name || "",
      sector: equipment?.sector || "",
      status: equipment?.status || "Operacional",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would send this to your backend
    console.log(values);
    toast({
      title: `Equipamento ${equipment ? "Atualizado" : "Adicionado"}`,
      description: `O equipamento "${values.name}" foi salvo com sucesso.`,
    });
    closeDialog();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
