import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { remindersService } from '../models/remindersService';
import { humanizeError } from '@/shared/lib/errors';

/** Título de exemplo pré-preenchido (espelha o placeholder do campo). */
const DEFAULT_TITLE = 'Entregar ao João';

interface UseReminderFormViewModelOptions {
  prefilledSaleId?: string;
  prefilledRemindAt?: Date;
  /** Nome do cliente da venda vinculada — entra no título pré-preenchido. */
  prefilledCustomerName?: string;
  onSuccess?: () => void;
}

export function useReminderFormViewModel({
  prefilledSaleId,
  prefilledRemindAt,
  prefilledCustomerName,
  onSuccess,
}: UseReminderFormViewModelOptions = {}) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const userId = profile?.id ?? '';
  const queryClient = useQueryClient();

  const defaultTitle = prefilledCustomerName
    ? `Entregar para ${prefilledCustomerName}`
    : DEFAULT_TITLE;

  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState('');
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && !selectedRecipientIds.includes(userId)) {
      setSelectedRecipientIds([userId]);
    }
  }, [userId]);

  useEffect(() => {
    if (prefilledRemindAt) {
      setRemindAt(prefilledRemindAt);
    }
  }, [prefilledRemindAt]);

  const membersQuery = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: () => remindersService.getCompanyMembers(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  function toggleRecipient(uid: string) {
    setSelectedRecipientIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  const mutation = useMutation({
    mutationFn: () =>
      remindersService.create(companyId, userId, {
        title,
        body: body || undefined,
        remindAt: remindAt!,
        recipientIds: selectedRecipientIds,
        saleId: prefilledSaleId ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
      setTitle(defaultTitle);
      setBody('');
      setRemindAt(null);
      setSelectedRecipientIds(userId ? [userId] : []);
      setFormError(null);
      onSuccess?.();
    },
  });

  function submit() {
    setFormError(null);
    if (!title.trim()) {
      setFormError('Título obrigatório.');
      return;
    }
    if (!remindAt || remindAt <= new Date()) {
      setFormError('A data/hora deve ser no futuro.');
      return;
    }
    if (selectedRecipientIds.length === 0) {
      setFormError('Escolha ao menos um destinatário.');
      return;
    }
    mutation.mutate();
  }

  return {
    title,
    setTitle,
    body,
    setBody,
    remindAt,
    setRemindAt,
    members: membersQuery.data ?? [],
    isLoadingMembers: membersQuery.isLoading,
    selectedRecipientIds,
    toggleRecipient,
    submit,
    isSubmitting: mutation.isPending,
    formError: formError ?? (mutation.error ? humanizeError(mutation.error) : null),
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
