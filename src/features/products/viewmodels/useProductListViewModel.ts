import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '../models/productService';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;

export function useProductListViewModel() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();

  const [search, setSearch] = useState('');
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const query = useQuery<Product[], Error>({
    queryKey: ['products', profile?.company_id],
    queryFn: () => productService.list(profile!.company_id),
    enabled: !!profile,
    staleTime: 30_000,
  });

  const products = useMemo<Product[]>(() => {
    const all = query.data ?? [];
    const lower = search.trim().toLowerCase();
    return all.filter((p) => {
      if (lower && !p.name.toLowerCase().includes(lower)) return false;
      return true;
    });
  }, [query.data, search]);

  return {
    products,
    isEmpty: products.length === 0,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    search,
    setSearch,
    showCreateSheet,
    setShowCreateSheet,
    companyId: profile?.company_id ?? '',
    refresh: query.refetch,
    navigateToDetail: (productId: string) =>
      navigation.navigate('ProductDetail', { productId }),
  };
}
