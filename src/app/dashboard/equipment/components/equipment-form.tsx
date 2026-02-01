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
import type { Equipment, Client } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc, writeBatch } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useState, useRef } from "react";
import Image from "next/image";

const DEFAULT_COMPONENTS = [
    { name: 'Estrutura: Viga Principal' },
    { name: 'Estrutura: Cabeceiras' },
    { name: 'Estrutura: Guarda Corpo e Passadiço' },
    { name: 'Estrutura: Carro Guincho' },
    { name: 'Caminho de Rolamento: Translação da Ponte' },
    { name: 'Caminho de Rolamento: Translação do Carro Guincho' },
    { name: 'Mecânico - Elevação: Tambor' },
    { name: 'Mecânico - Elevação: Redutor Principal' },
    { name: 'Mecânico - Elevação: Freio' },
    { name: 'Mecânico - Elevação: Gancho/Moitão' },
    { name: 'Mecânico - Elevação: Cabo de Aço' },
    { name: 'Mecânico - Translação do Carro: Redutor' },
    { name: 'Mecânico - Translação do Carro: Freio' },
    { name: 'Mecânico - Translação do Carro: Rodas' },
    { name: 'Mecânico - Translação do Carro: Batedores' },
    { name: 'Mecânico - Translação da Ponte: Redutor' },
    { name: 'Mecânico - Translação da Ponte: Freio' },
    { name: 'Mecânico - Translação da Ponte: Rodas' },
    { name: 'Mecânico - Translação da Ponte: Batedores' },
    { name: 'Motor: Elevação Principal' },
    { name: 'Motor: Translação do Carro' },
    { name: 'Motor: Translação da Ponte' },
    { name: 'Elétrico: Painéis e Cabos' },
    { name: 'Elétrico: Alimentação da Ponte' },
    { name: 'Elétrico: Alimentação do Carro' },
];

const componentSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome do componente é obrigatório"),
});

const formSchema = z.object({
  tag: z.string().min(1, "TAG é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  sector: z.string().min(1, "Setor é obrigatório"),
  status: z.enum(["Operacional", "Requer Atenção", "Fora de Serviço"]),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  components: z.array(componentSchema),
});

type EquipmentFormProps = {
  equipment?: Equipment;
  closeDialog: () => void;
};

export function EquipmentForm({ equipment, closeDialog }: EquipmentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [imagePreview, setImagePreview] = useState<string | null>(equipment?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag: equipment?.tag || "",
      name: equipment?.name || "",
      sector: equipment?.sector || "",
      status: equipment?.status || "Operacional",
      clientId: equipment?.clientId || "",
      components: equipment?.components?.length ? equipment.components : DEFAULT_COMPONENTS,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject;
        if(event.target?.result) {
          img.src = event.target.result as string;
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { components, ...equipmentData } = values;
    const equipmentCollection = collection(firestore, "equipment");
    
    let processedImageUrl = imagePreview;
    if (imageFile) {
        processedImageUrl = await processImage(imageFile);
    }
    
    const dataWithImage = { ...equipmentData, imageUrl: processedImageUrl };


    if (equipment) {
      // Update logic
      const equipmentDoc = doc(equipmentCollection, equipment.id);
      updateDocumentNonBlocking(equipmentDoc, dataWithImage);
      
      const batch = writeBatch(firestore);
      const componentsCollectionRef = collection(equipmentDoc, "components");
      
      // Handle component updates/creations
      components.forEach(comp => {
        const compDoc = comp.id && !comp.id.startsWith('new-') ? doc(componentsCollectionRef, comp.id) : doc(componentsCollectionRef);
        batch.set(compDoc, { name: comp.name });
      });

      // Handle component deletions
      const currentComponentIds = components.map(c => c.id).filter(Boolean);
      equipment.components?.forEach(existingComp => {
        if (!currentComponentIds.includes(existingComp.id)) {
          batch.delete(doc(componentsCollectionRef, existingComp.id));
        }
      });
      await batch.commit();

    } else {
      // Create logic
      const newDocRefPromise = addDocumentNonBlocking(equipmentCollection, dataWithImage);
      newDocRefPromise.then(newDocRef => {
        if(newDocRef) {
          const componentsCollectionRef = collection(newDocRef, "components");
          const batch = writeBatch(firestore);
          components.forEach(comp => {
            const compDoc = doc(componentsCollectionRef);
            batch.set(compDoc, { name: comp.name });
          });
          batch.commit();
        }
      })
    }
    
    toast({
      title: `Equipamento ${equipment ? "Atualizado" : "Adicionado"}`,
      description: `A ponte rolante "${values.name}" foi salva com sucesso.`,
    });
    closeDialog();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-6">
            <FormItem>
              <FormLabel>Imagem do Equipamento</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center border overflow-hidden">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview do equipamento"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Alterar Imagem
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Opcional. A imagem será exibida no card do equipamento.
              </FormDescription>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Carregando clientes..." : "Selecione um cliente"} />
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
                Liste as partes principais da ponte rolante a serem inspecionadas.
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
