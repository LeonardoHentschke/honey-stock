import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { remindersService } from '../models/remindersService';
import { humanizeError } from '@/shared/lib/errors';

function parseBRDateTime(dateStr: string, timeStr: string): Date | null {
  const parts = dateStr.split('/').map(Number);
  const timeParts = (timeStr || '00:00').split(':').map(Number);
  const [d, m, y] = parts;
  const [h, min] = timeParts;
  if (!d || !m || !y || isNaN(h) || isNaN(min)) return null;
  const date = new Date(y, m - 1, d, h, min, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

function formatDateToBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatTimeToBR(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

interface UseReminderFormViewModelOptions {
  prefilledSaleId?: string;
  prefilledRemindAt?: Date;
  onSuccess?: () => void;
}

export function useReminderFormViewModel({
  prefilledSaleId,
  prefilledRemindAt,
  onSuccess,
}: UseReminderFormViewModelOptions = {}) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const userId = profile?.id ?? '';
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scheduledDateText, setScheduledDateText] = useState('');
  const [scheduledTimeText, setScheduledTimeText] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && !selectedRecipientIds.includes(userId)) {
      setSelectedRecipientIds([userId]);
    }
  }, [userId]);

  useEffect(() => {
    if (prefilledRemindAt) {
      setScheduledDateText(formatDateToBR(prefilledRemindAt));
      setScheduledTimeText(formatTimeToBR(prefilledRemindAt));
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
    mutationFn: () => {
      const remindAt = parseBRDateTime(scheduledDateText, scheduledTimeText);
      return remindersService.create(companyId, userId, {
        title,
        body: body || undefined,
        remindAt: remindAt!,
        recipientIds: selectedRecipientIds,
        saleId: prefilledSaleId ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
      setTitle('');
      setBody('');
      setScheduledDateText('');
      setScheduledTimeText('');
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
    const remindAt = parseBRDateTime(scheduledDateText, scheduledTimeText);
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
    scheduledDateText,
    setScheduledDateText,
    scheduledTimeText,
    setScheduledTimeText,
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
