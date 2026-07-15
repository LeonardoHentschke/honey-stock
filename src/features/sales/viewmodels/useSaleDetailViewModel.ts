import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  salesService,
  paidAmount,
  balance,
  paymentStatus,
  type PaymentMethod,
} from '../models/salesService';
import { humanizeError } from '@/shared/lib/errors';

export function useSaleDetailViewModel(saleId: string) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const userId = profile?.id ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesService.get(saleId),
    enabled: !!saleId,
  });

  const payment = useMemo(() => {
    const sale = query.data;
    if (!sale) return { paid: 0, balance: 0, status: 'pending' as const };
    return {
      paid: paidAmount(sale),
      balance: balance(sale),
      status: paymentStatus(sale),
    };
  }, [query.data]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
    queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
    queryClient.invalidateQueries({ queryKey: ['customer-sales'] });
  };

  const registerPaymentMutation = useMutation({
    mutationFn: (values: { amount: number; method: PaymentMethod; notes?: string }) =>
      salesService.registerPayment({
        saleId,
        companyId,
        userId,
        amount: values.amount,
        method: values.method,
        notes: values.notes,
      }),
    onSuccess: invalidateAll,
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

    // Pagamento
    payments: query.data?.payments ?? [],
    paid: payment.paid,
    balance: payment.balance,
    paymentStatus: payment.status,
    registerPayment: registerPaymentMutation.mutate,
    isRegisteringPayment: registerPaymentMutation.isPending,
    registerPaymentError: registerPaymentMutation.error
      ? humanizeError(registerPaymentMutation.error)
      : null,
    isPaymentRegistered: registerPaymentMutation.isSuccess,
    resetPaymentMutation: registerPaymentMutation.reset,
  };
}
