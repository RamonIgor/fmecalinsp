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
import { useToast } from "@/hooks/use-toast";
import type { Inspector } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser } from "@/ai/flows/user-management-flow";


const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "inspector"]),
});

type InspectorFormProps = {
  inspector?: Inspector & { email?: string, role?: string };
  closeDialog: () => void;
};

export function InspectorForm({ inspector, closeDialog }: InspectorFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: inspector?.name || "",
      phone: inspector?.phone || "",
      email: inspector?.email || "",
      password: "",
      role: (inspector?.role as "admin" | "inspector") || "inspector",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (inspector) {
      // Update logic
      const inspectorDoc = doc(collection(firestore, "inspectors"), inspector.id);
      const {email, password, role, ...inspectorData} = values;
      updateDocumentNonBlocking(inspectorDoc, inspectorData);

      // Note: Updating user's email/password/role in Firebase Auth requires admin privileges
      // and is typically done via a backend function for security.
      // The current implementation only updates the Firestore document.

      toast({
        title: `Inspetor Atualizado`,
        description: `O inspetor "${values.name}" foi salvo com sucesso.`,
      });

    } else {
      // Create logic
      try {
        const newUser = await createUser({ 
          email: values.email, 
          password: values.password, 
          role: values.role,
          displayName: values.name
        });

        if (!newUser || !newUser.uid) {
            throw new Error("A criação do usuário não retornou um UID.");
        }

        const inspectorsCollection = collection(firestore, "inspectors");
        addDocumentNonBlocking(inspectorsCollection, {
            name: values.name, 
            phone: values.phone,
            userId: newUser.uid, // Link the inspector profile to the auth user
        });
        
        toast({
          title: `Usuário Criado`,
          description: `O usuário "${values.name}" foi criado com sucesso.`,
        });

      } catch (error: any) {
         toast({
          variant: "destructive",
          title: "Erro ao criar usuário",
          description: error.message || "Não foi possível criar o novo usuário.",
        });
      }
    }
    closeDialog();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="ex: (11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de Acesso</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ex: joao.silva@email.com" {...field} disabled={!!inspector} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={!!inspector} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Perfil</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!inspector}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="inspector">Inspetor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
             {inspector ? "Salvar Alterações" : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
