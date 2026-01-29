'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import { useAuth, useFirestore } from '@/firebase/provider';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const bgImage = PlaceHolderImages.find((img) => img.id === 'landing-background');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });

        if (role === 'admin') {
          router.push('/dashboard');
        } else if (role === 'inspector') {
          router.push('/app');
        } else {
          router.push('/login');
        }
      } else {
        throw new Error('Perfil de usuário não encontrado.');
      }
    } catch (error: any) {
      console.error(error);
      let description = 'Ocorreu um erro. Tente novamente.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.message === 'Perfil de usuário não encontrado.'
      ) {
        description = 'Email, senha ou perfil inválidos.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email Necessário',
        description: 'Por favor, insira seu email para recuperar a senha.',
      });
      return;
    }
    setIsResetting(true);
    try {
      auth.languageCode = 'pt';
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Link Enviado',
        description: 'Verifique seu email para o link de recuperação de senha.',
      });
      setIsResetOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao Enviar',
        description:
          'Não foi possível enviar o email de recuperação. Verifique o email e tente novamente.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            fill
            quality={80}
            className="object-cover"
            data-ai-hint={bgImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-zinc-900/70" />

        <div className="relative z-20 w-full max-w-md">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 flex flex-col items-center gap-2">
                <Logo className="h-12 w-12 text-primary" />
                <span className="font-bold text-3xl">CraneCheck</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription>Acesse sua conta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu.email@empresa.com"
                            {...field}
                            className="h-11 bg-background/70 border-border/50"
                          />
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
                        <FormLabel className="sr-only">Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="h-11 bg-background/70 border-border/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 font-bold text-base"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Entrar
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center text-sm">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-white/80 hover:text-white px-0"
                >
                  Esqueceu sua senha?
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="absolute bottom-6 left-6 z-20 hidden md:block text-white">
          <blockquote className="space-y-2">
            <p className="text-lg">
              “Qualidade significa fazer o certo quando ninguém está olhando.”
            </p>
            <footer className="text-sm">- Henry Ford</footer>
          </blockquote>
        </div>
      </main>
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Insira seu email para receber um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                type="email"
                placeholder="seu.email@empresa.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
            >
              {isResetting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
