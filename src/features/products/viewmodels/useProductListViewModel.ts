import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  productService,
  type ProductWithVariants,
  type ProductVariant,
} from '../models/productService';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;

export interface ProductVariantRow {
  product: ProductWithVariants;
  /** `null` quando o produto ainda não tem variante ativa cadastrada. */
  variant: ProductVariant | null;
}

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

  const variantRows = useMemo<ProductVariantRow[]>(() => {
    const products = query.data ?? [];
    const lower = search.trim().toLowerCase();

    const rows: ProductVariantRow[] = [];
    for (const product of products) {
      const matchesProduct = !lower || product.name.toLowerCase().includes(lower);
      const activeVariants = (product.variants ?? []).filter((v) => v.is_active);

      // Produto sem variante ativa: ainda assim aparece, como linha tocável
      // que leva ao detalhe para cadastrar a primeira variante.
      if (activeVariants.length === 0) {
        if (filterLowStock) continue;
        if (lower && !matchesProduct) continue;
        rows.push({ product, variant: null });
        continue;
      }

      for (const variant of activeVariants) {
        if (filterLowStock && variant.stock_quantity > variant.min_stock) continue;
        if (
          lower &&
          !matchesProduct &&
          !variant.sku.toLowerCase().includes(lower) &&
          !(variant.packaging ?? '').toLowerCase().includes(lower)
        ) {
          continue;
        }
        rows.push({ product, variant });
      }
    }
    return rows;
  }, [query.data, search, filterLowStock]);

  return {
    variantRows,
    isEmpty: variantRows.length === 0,
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
