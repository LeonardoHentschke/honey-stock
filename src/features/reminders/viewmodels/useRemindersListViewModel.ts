import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { remindersService, type Reminder } from '../models/remindersService';

export function useRemindersListViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';

  const [showFormSheet, setShowFormSheet] = useState(false);

  const query = useQuery({
    queryKey: ['reminders', companyId],
    queryFn: () => remindersService.list(companyId),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  return {
    reminders: (query.data ?? []) as Reminder[],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refresh: query.refetch,
    showFormSheet,
    openCreate: () => setShowFormSheet(true),
    closeSheet: () => setShowFormSheet(false),
  };
}
