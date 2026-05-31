import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { customerService } from '../models/customerService';
import type { CustomerValues } from '../models/customerSchemas';

export function useCustomerDetailViewModel(customerId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showEditSheet, setShowEditSheet] = useState(false);

  const query = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.get(customerId),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: CustomerValues) => customerService.update(customerId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setShowEditSheet(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => customerService.deactivate(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });

  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    showEditSheet,
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    updateCustomer: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    deactivate: deactivateMutation.mutate,
    isDeactivating: deactivateMutation.isPending,
    refresh: query.refetch,
  };
}
