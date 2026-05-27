import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  signUpOwnerSchema,
  signUpMemberSchema,
  type SignUpOwnerFormValues,
  type SignUpMemberFormValues,
} from '../models/authSchemas';
import * as authService from '../models/authService';
import { reloadProfile } from '@/shared/hooks/useAuth';

export type SignUpTab = 'owner' | 'member';

export function useSignUpViewModel(initialTab: SignUpTab = 'owner') {
  const [activeTab, setActiveTab] = useState<SignUpTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  // Dois forms independentes — estado preservado ao trocar de tab
  const ownerForm = useForm<SignUpOwnerFormValues>({
    resolver: zodResolver(signUpOwnerSchema),
    defaultValues: { companyName: '', fullName: '', email: '', password: '' },
  });

  const memberForm = useForm<SignUpMemberFormValues>({
    resolver: zodResolver(signUpMemberSchema),
    defaultValues: { inviteCode: '', fullName: '', email: '', password: '' },
  });

  const onSubmitOwner = ownerForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      const userId = await authService.signUpOwner(
        data.email,
        data.password,
        data.fullName,
        data.companyName,
      );
      // Recarrega o perfil após todos os inserts (empresa + perfil).
      // Necessário pois o onAuthStateChange pode ter disparado antes dos
      // inserts terminarem, deixando profile=null no store.
      await reloadProfile(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.';
      ownerForm.setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  });

  const onSubmitMember = memberForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      const userId = await authService.signUpMember(
        data.email,
        data.password,
        data.fullName,
        data.inviteCode,
      );
      await reloadProfile(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na empresa.';
      memberForm.setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  });

  return {
    activeTab,
    setActiveTab,
    ownerForm,
    memberForm,
    isLoading,
    onSubmitOwner,
    onSubmitMember,
  };
}
