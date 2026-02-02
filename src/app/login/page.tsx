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
import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
  rememberMe: z.boolean().default(true),
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
  const [showPassword, setShowPassword] = useState(false);
  const bgImage = PlaceHolderImages.find((img) => img.id === 'landing-background');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // On page load, check local storage for a saved email and checkbox preference
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmailForLogin');
    const shouldRemember = localStorage.getItem('rememberMePreference') === 'true';
    
    // Set the checkbox state first
    form.setValue('rememberMe', shouldRemember);

    // If the preference was to remember, and an email exists, set it
    if (shouldRemember && savedEmail) {
      form.setValue('email', savedEmail);
    }
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);

      // Sign in successful
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Handle the "Remember Email" preference
        if (values.rememberMe) {
          localStorage.setItem('savedEmailForLogin', values.email);
          localStorage.setItem('rememberMePreference', 'true');
        } else {
          localStorage.removeItem('savedEmailForLogin');
          localStorage.removeItem('rememberMePreference');
        }

        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });

        if (userData.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/app');
        }
      } else {
        // This case should ideally not happen if user creation is robust
        await auth.signOut(); // Sign out the user from auth
        // Clean up local storage on failure as well
        localStorage.removeItem('savedEmailForLogin');
        localStorage.removeItem('rememberMePreference');
        throw new Error('Perfil de usuário não encontrado no banco de dados.');
      }
    } catch (error: any) {
      // Handle all errors (from persistence or sign-in)
      console.error("Login Error:", error);
      let title = 'Falha no Login';
      let description = 'Ocorreu um erro. Tente novamente.';

      if (error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential') {
        description = 'Email ou senha inválidos.';
      } else if (error.message.includes('persistence')) {
          title = 'Falha na Configuração';
          description = 'Não foi possível salvar sua preferência de login.';
      } else if (error.message.includes('Perfil de usuário não encontrado')) {
          description = 'Seu usuário foi autenticado, mas não encontramos seu perfil. Contate o suporte.';
      }

      toast({
        variant: 'destructive',
        title: title,
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
                <span className="font-bold text-3xl">F.Mecal Insp.</span>
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
                            autoComplete="email"
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
                        <div className="relative">
                            <FormControl>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                {...field}
                                className="h-11 bg-background/70 border-border/50 pr-10 placeholder:text-white/30"
                            />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute inset-y-0 right-0 h-full w-10 text-white/80 hover:bg-transparent hover:text-white"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                                ) : (
                                <Eye className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="remember-me"
                            className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        </FormControl>
                        <Label htmlFor="remember-me" className="cursor-pointer text-white/80">
                          Lembrar meu email
                        </Label>
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
              "Qualidade significa fazer o certo quando ninguém está olhando."
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
                autoComplete="email"
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
