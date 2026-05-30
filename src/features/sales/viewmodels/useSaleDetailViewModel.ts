import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { salesService } from '../models/salesService';
import { humanizeError } from '@/shared/lib/errors';

export function useSaleDetailViewModel(saleId: string) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesService.get(saleId),
    enabled: !!saleId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesService.cancel(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: () => salesService.markDelivered(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
    },
  });

  return {
    sale: query.data,
    isLoading: query.isLoading,
    error: query.error ? humanizeError(query.error) : null,
    cancelSale: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
    cancelError: cancelMutation.error ? humanizeError(cancelMutation.error) : null,
    markDelivered: deliverMutation.mutate,
    isDelivering: deliverMutation.isPending,
    deliverError: deliverMutation.error ? humanizeError(deliverMutation.error) : null,
  };
}
