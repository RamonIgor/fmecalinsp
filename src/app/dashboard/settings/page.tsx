'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ProfileForm } from '@/components/profile/profile-form';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Perfil</CardTitle>
        <CardDescription>
          Atualize seu nome de exibição e foto de perfil. Essas informações
          serão vistas por outros membros da equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm />
      </CardContent>
    </Card>
  );
}
