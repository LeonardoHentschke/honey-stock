import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { inventoryService, type MovementWithProduct } from '../models/inventoryService';

export function useStockMovesViewModel() {
  const { profile } = useAuth();

  const query = useQuery<MovementWithProduct[], Error>({
    queryKey: ['stockMoves', profile?.company_id],
    queryFn: () => inventoryService.listAllMovements(profile!.company_id),
    enabled: !!profile,
    staleTime: 30_000,
  });

  return {
    movements: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refresh: query.refetch,
  };
}
