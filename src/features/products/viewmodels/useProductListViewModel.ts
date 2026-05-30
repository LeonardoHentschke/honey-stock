import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type ProductWithVariants } from '../models/productService';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;

export function useProductListViewModel() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();

  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const query = useQuery<ProductWithVariants[], Error>({
    queryKey: ['products', profile?.company_id],
    queryFn: () => productService.list(profile!.company_id),
    enabled: !!profile,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    let items = query.data ?? [];

    if (search.trim()) {
      const lower = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lower));
    }

    if (filterLowStock) {
      items = items.filter((p) =>
        p.variants.some((v) => v.is_active && v.stock_quantity <= v.min_stock)
      );
    }

    return items;
  }, [query.data, search, filterLowStock]);

  return {
    products: filtered,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    search,
    setSearch,
    filterLowStock,
    setFilterLowStock,
    showCreateSheet,
    setShowCreateSheet,
    refresh: query.refetch,
    navigateToDetail: (productId: string) =>
      navigation.navigate('ProductDetail', { productId }),
  };
}
