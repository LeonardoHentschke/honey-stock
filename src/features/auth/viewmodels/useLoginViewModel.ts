import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../models/authSchemas';
import * as authService from '../models/authService';

export function useLoginViewModel() {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await authService.signIn(data.email, data.password);
      // Sessão atualizada pelo useAuthListener → RootNavigator troca para AppTabs
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.';
      setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  });

  async function onGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar com Google.';
      setError('root', { message });
    } finally {
      setGoogleLoading(false);
    }
  }

  return {
    control,
    errors,
    isLoading,
    googleLoading,
    onSubmit,
    onGoogleSignIn,
  };
}
