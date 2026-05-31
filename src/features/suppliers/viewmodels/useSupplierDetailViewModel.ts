import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { supplierService } from '../models/supplierService';
import type { SupplierValues } from '../models/supplierSchemas';

export function useSupplierDetailViewModel(supplierId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showEditSheet, setShowEditSheet] = useState(false);

  const query = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => supplierService.get(supplierId),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: SupplierValues) => supplierService.update(supplierId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      setShowEditSheet(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => supplierService.deactivate(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
    },
  });

  return {
    supplier: query.data ?? null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    showEditSheet,
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    updateSupplier: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    deactivate: deactivateMutation.mutate,
    isDeactivating: deactivateMutation.isPending,
    refresh: query.refetch,
  };
}
