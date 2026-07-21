import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '../models/productService';
import { inventoryService } from '@/features/inventory/models/inventoryService';
import { humanizeError } from '@/shared/lib/errors';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;

export function useProductDetailViewModel(productId: string) {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery<Product, Error>({
    queryKey: ['product', productId],
    queryFn: () => productService.get(productId),
    staleTime: 30_000,
  });

  const movementsQuery = useQuery({
    queryKey: ['movements', productId],
    queryFn: () => inventoryService.listMovements(productId),
    staleTime: 30_000,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => productService.deactivate(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['products-active', profile?.company_id] });
      navigation.goBack();
    },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  return {
    product: query.data ?? null,
    movements: movementsQuery.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching || movementsQuery.isRefetching,
    error: query.error,
    mutationError,
    showEditSheet,
    companyId: profile?.company_id ?? '',
    refresh: () => {
      query.refetch();
      movementsQuery.refetch();
    },
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    onSheetSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['movements', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['products-active', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    deactivateProduct: () => deactivateMutation.mutate(),
    isDeactivating: deactivateMutation.isPending,
    clearMutationError: () => setMutationError(null),
  };
}
