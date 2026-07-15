import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { customerService } from '../models/customerService';
import { salesService, balance } from '@/features/sales/models/salesService';
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

  const salesQuery = useQuery({
    queryKey: ['customer-sales', customerId],
    queryFn: () => salesService.listByCustomer(customerId),
    staleTime: 30_000,
  });

  const sales = useMemo(() => salesQuery.data ?? [], [salesQuery.data]);

  const summary = useMemo(() => {
    const billable = sales.filter((s) => s.status !== 'canceled');
    const totalSpent = billable.reduce((sum, s) => sum + (s.total ?? 0), 0);
    const count = billable.length;
    const avgTicket = count > 0 ? totalSpent / count : 0;
    const lastPurchaseDate = sales.length > 0 ? new Date(sales[0].created_at) : null;
    const totalReceivable = billable.reduce((sum, s) => sum + balance(s), 0);
    return { totalSpent, count, avgTicket, lastPurchaseDate, totalReceivable };
  }, [sales]);

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
    isRefetching: query.isRefetching || salesQuery.isRefetching,
    error: query.error,
    sales,
    salesLoading: salesQuery.isLoading,
    summary,
    showEditSheet,
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    updateCustomer: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    deactivate: deactivateMutation.mutate,
    isDeactivating: deactivateMutation.isPending,
    refresh: () => {
      query.refetch();
      salesQuery.refetch();
    },
  };
}
