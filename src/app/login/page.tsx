
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
import Logo from "@/components/logo";
import { useAuth, useFirestore } from "@/firebase/provider";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const formSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const bgImage = PlaceHolderImages.find(img => img.id === 'landing-background');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando...",
        });

        if (role === 'admin') {
          router.push('/dashboard');
        } else if (role === 'inspector') {
          router.push('/app');
        } else {
          router.push('/login');
        }
      } else {
        throw new Error("Perfil de usuário não encontrado.");
      }

    } catch (error: any) {
      console.error(error);
      let description = "Ocorreu um erro. Tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.message === "Perfil de usuário não encontrado.") {
        description = "Email, senha ou perfil inválidos.";
      }
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
        {bgImage && (
            <Image
                src={bgImage.imageUrl}
                alt={bgImage.description}
                fill
                quality={80}
                className="object-cover grayscale"
                data-ai-hint={bgImage.imageHint}
            />
        )}
        <div className="absolute inset-0 bg-zinc-900/60" />

        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-2xl">CraneCheck</span>
        </div>
        <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
            <p className="text-lg">
                “Qualidade significa fazer o certo quando ninguém está olhando.”
            </p>
            <footer className="text-sm">- Henry Ford</footer>
            </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
            <div className="text-center lg:text-left">
                <div className="mx-auto mb-4 lg:hidden flex items-center justify-center gap-2">
                    <Logo className="h-10 w-10" />
                    <span className="font-semibold text-3xl">CraneCheck</span>
                </div>
                <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
                <p className="text-muted-foreground">Acesse sua conta para continuar</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="seu.email@empresa.com" {...field} className="h-11 bg-card border-border"/>
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
                        <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-card border-border"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full h-11 font-bold text-base" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                </Button>
                </form>
            </Form>
        </div>
      </div>
    </main>
  );
}
