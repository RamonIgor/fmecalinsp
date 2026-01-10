
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
import type { User as UserData } from "@/lib/data";
import { useFirestore } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser } from "@/ai/flows/user-management-flow";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";


const formSchema = z.object({
  displayName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["admin", "inspector"]),
}).refine(data => !!data.password || !!data.displayName, { // A bit of a hack to make password optional for edit
  message: "A senha é obrigatória para novos usuários.",
  path: ["password"],
});


type UserFormProps = {
  user?: UserData;
  closeDialog: () => void;
};

export function UserForm({ user, closeDialog }: UserFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const isEditMode = !!user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "inspector",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode) {
      // Update logic
      const userDoc = doc(collection(firestore, "users"), user.id);
      // We only update displayName and role in Firestore for an existing user.
      // Email/password changes should be handled via a more secure flow.
      updateDocumentNonBlocking(userDoc, { 
        displayName: values.displayName,
        role: values.role,
      });

      toast({
        title: `Usuário Atualizado`,
        description: `O usuário "${values.displayName}" foi salvo com sucesso.`,
      });
      closeDialog();

    } else {
      // Create logic
      if (!values.password) {
        form.setError("password", { message: "A senha é obrigatória." });
        return;
      }
      try {
        await createUser({ 
          email: values.email, 
          password: values.password, 
          role: values.role,
          displayName: values.displayName
        });
        
        toast({
          title: `Usuário Criado`,
          description: `O usuário "${values.displayName}" foi criado com sucesso.`,
        });
        closeDialog();

      } catch (error: any) {
         toast({
          variant: "destructive",
          title: "Erro ao criar usuário",
          description: error.message || "Não foi possível criar o novo usuário.",
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-auto max-h-[70vh]">
            <div className="space-y-4 pr-6">
                <FormField
                control={form.control}
                name="displayName"
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
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email de Acesso</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="ex: joao.silva@email.com" {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {!isEditMode && (
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {isEditMode ? "Salvar Alterações" : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
