import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../models/authSchemas';
import * as authService from '../models/authService';

export function useForgotPasswordViewModel() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(data.email);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail.';
      setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  });

  return {
    control,
    errors,
    isLoading,
    success,
    onSubmit,
  };
}
