'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Schema for the password reset form
const formSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

// Component to handle different auth actions
const AuthActionHandler = () => {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [isLoading, setIsLoading] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const bgImage = PlaceHolderImages.find((img) => img.id === 'landing-background');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (!oobCode || !auth) {
      setIsLoading(false);
      return;
    }
    // Verify the code is valid
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setIsValidCode(true);
      })
      .catch((error) => {
        console.error(error);
        setIsValidCode(false);
        toast({
          variant: 'destructive',
          title: 'Link Inválido',
          description: 'O link de redefinição de senha é inválido ou expirou. Por favor, tente novamente.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [oobCode, auth, toast]);

  const handlePasswordReset = async (values: z.infer<typeof formSchema>) => {
    if (!oobCode) return;
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      toast({
        title: 'Senha Redefinida!',
        description: 'Sua senha foi alterada com sucesso. Você já pode fazer o login.',
      });
      router.push('/login');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Redefinir',
        description: 'Não foi possível redefinir sua senha. O link pode ter expirado.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <CardContent className="flex flex-col items-center gap-4 text-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Verificando link...</p>
            </CardContent>
        );
    }

    if (!isValidCode || !oobCode || mode !== 'resetPassword') {
      return (
         <CardContent className="text-center p-6">
            <CardTitle className="text-2xl font-bold">Link Inválido</CardTitle>
            <CardDescription className="mt-2">
                Este link é inválido ou já expirou. Por favor, solicite um novo link de redefinição de senha na página de login.
            </CardDescription>
             <Button className="mt-6 w-full" onClick={() => router.push('/login')}>
                Voltar para o Login
            </Button>
         </CardContent>
      );
    }

    return (
        <>
            <CardHeader className="items-center text-center">
                <div className="mb-4 flex flex-col items-center gap-2">
                    <Logo className="h-12 w-12 text-primary" />
                    <span className="font-bold text-3xl">CraneCheck</span>
                </div>
                <CardTitle className="text-2xl font-bold">
                    Redefinir sua Senha
                </CardTitle>
                <CardDescription>
                    Crie uma nova senha para sua conta: {email}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">Nova Senha</FormLabel>
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
                    <Button type="submit" className="w-full h-11 font-bold text-base" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Nova Senha"}
                    </Button>
                    </form>
                </Form>
            </CardContent>
        </>
    );
  };

  return (
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
                {renderContent()}
            </Card>
        </div>
    </main>
  );
};

export default AuthActionHandler;
