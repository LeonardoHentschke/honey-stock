import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { remindersService } from '../models/remindersService';
import { humanizeError } from '@/shared/lib/errors';

export function useReminderDetailViewModel(reminderId: string) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reminder', reminderId],
    queryFn: () => remindersService.get(reminderId),
    enabled: !!reminderId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => remindersService.cancel(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder', reminderId] });
      queryClient.invalidateQueries({ queryKey: ['reminders', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
    },
  });

  return {
    reminder: query.data,
    isLoading: query.isLoading,
    error: query.error ? humanizeError(query.error) : null,
    cancelReminder: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
    cancelError: cancelMutation.error ? humanizeError(cancelMutation.error) : null,
  };
}
