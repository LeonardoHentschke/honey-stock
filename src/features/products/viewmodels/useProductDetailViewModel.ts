import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type ProductWithVariants } from '../models/productService';
import { humanizeError } from '@/shared/lib/errors';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;

export function useProductDetailViewModel(productId: string) {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showVariantSheet, setShowVariantSheet] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery<ProductWithVariants, Error>({
    queryKey: ['product', productId],
    queryFn: () => productService.get(productId),
    staleTime: 30_000,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => productService.deactivate(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', profile?.company_id] });
      navigation.goBack();
    },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  return {
    product: query.data ?? null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    mutationError,
    showEditSheet,
    showVariantSheet,
    editingVariantId,
    refresh: query.refetch,
    openEditSheet: () => setShowEditSheet(true),
    closeEditSheet: () => setShowEditSheet(false),
    openCreateVariantSheet: () => {
      setEditingVariantId(null);
      setShowVariantSheet(true);
    },
    openEditVariantSheet: (variantId: string) => {
      setEditingVariantId(variantId);
      setShowVariantSheet(true);
    },
    closeVariantSheet: () => {
      setShowVariantSheet(false);
      setEditingVariantId(null);
    },
    onSheetSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', profile?.company_id] });
    },
    deactivateProduct: () => deactivateMutation.mutate(),
    isDeactivating: deactivateMutation.isPending,
    clearMutationError: () => setMutationError(null),
  };
}
