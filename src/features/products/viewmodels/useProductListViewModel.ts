import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '../models/productService';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;
type Route = RouteProp<ProductsStackParamList, 'ProductList'>;

export function useProductListViewModel() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    if (route.params?.filterLowStock) {
      setFilterLowStock(true);
      navigation.setParams({ filterLowStock: undefined });
    }
  }, [route.params?.filterLowStock, navigation]);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

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
      if (filterLowStock && p.stock_quantity > p.min_stock) return false;
      if (lower && !p.name.toLowerCase().includes(lower)) return false;
      return true;
    });
  }, [query.data, search, filterLowStock]);

  return {
    products,
    isEmpty: products.length === 0,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    search,
    setSearch,
    filterLowStock,
    setFilterLowStock,
    showCreateSheet,
    setShowCreateSheet,
    companyId: profile?.company_id ?? '',
    stockProduct,
    openStockEntry: (product: Product) => setStockProduct(product),
    closeStockEntry: () => setStockProduct(null),
    refresh: query.refetch,
    navigateToDetail: (productId: string) =>
      navigation.navigate('ProductDetail', { productId }),
  };
}
