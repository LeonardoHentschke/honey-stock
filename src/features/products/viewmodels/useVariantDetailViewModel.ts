import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { variantService } from '../models/variantService';
import { inventoryService } from '@/features/inventory/models/inventoryService';

export function useVariantDetailViewModel(variantId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showMovementSheet, setShowMovementSheet] = useState(false);

  const variantQuery = useQuery({
    queryKey: ['variant', variantId],
    queryFn: () => variantService.getWithProduct(variantId),
    staleTime: 60_000,
  });

  const movementsQuery = useQuery({
    queryKey: ['movements', variantId],
    queryFn: () => inventoryService.listMovements(variantId),
    staleTime: 30_000,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => variantService.deactivate(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['variant', variantId] });
    },
  });

  function onSheetSuccess() {
    variantQuery.refetch();
    movementsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  return {
    variant: variantQuery.data ?? null,
    movements: movementsQuery.data ?? [],
    isLoading: variantQuery.isLoading,
    isRefetching: variantQuery.isRefetching || movementsQuery.isRefetching,
    error: variantQuery.error,
    showEditSheet,
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    showMovementSheet,
    openMovementSheet: () => setShowMovementSheet(true),
    closeMovementSheet: () => setShowMovementSheet(false),
    onSheetSuccess,
    deactivate: deactivateMutation.mutate,
    isDeactivating: deactivateMutation.isPending,
    refresh: () => {
      variantQuery.refetch();
      movementsQuery.refetch();
    },
    companyId: profile?.company_id ?? '',
  };
}
