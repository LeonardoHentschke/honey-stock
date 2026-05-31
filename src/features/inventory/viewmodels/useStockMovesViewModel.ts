import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { inventoryService, type MovementWithVariant } from '../models/inventoryService';

export type MoveTypeFilter = 'all' | 'in' | 'out' | 'adjust' | 'sale';

export function useStockMovesViewModel() {
  const { profile } = useAuth();
  const [typeFilter, setTypeFilter] = useState<MoveTypeFilter>('all');

  const query = useQuery<MovementWithVariant[], Error>({
    queryKey: ['stockMoves', profile?.company_id, typeFilter],
    queryFn: () =>
      inventoryService.listAllMovements(
        profile!.company_id,
        typeFilter === 'all' ? null : typeFilter,
      ),
    enabled: !!profile,
    staleTime: 30_000,
  });

  return {
    movements: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    typeFilter,
    setTypeFilter,
    refresh: query.refetch,
  };
}
