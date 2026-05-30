import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { salesService, type Sale } from '../models/salesService';

export type PeriodFilter = 'today' | 'week' | 'month' | 'all';
export type ViewMode = 'history' | 'scheduled';

function startOf(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export function useSalesListViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';

  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('history');

  const query = useQuery({
    queryKey: ['sales', companyId],
    queryFn: () => salesService.list(companyId),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const filtered = useMemo<Sale[]>(() => {
    const all = (query.data ?? []).filter((s) => s.status !== 'scheduled');
    const from = startOf(period);
    if (!from) return all;
    return all.filter((s) => new Date(s.created_at) >= from);
  }, [query.data, period]);

  const scheduledSales = useMemo<Sale[]>(
    () =>
      (query.data ?? [])
        .filter((s) => s.status === 'scheduled')
        .sort((a, b) => {
          const da = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
          const db = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
          return da - db;
        }),
    [query.data]
  );

  const totalAmount = useMemo(
    () => filtered.filter((s) => s.status !== 'canceled').reduce((sum, s) => sum + s.total, 0),
    [filtered]
  );

  return {
    sales: filtered,
    scheduledSales,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refresh: query.refetch,
    period,
    setPeriod,
    totalAmount,
    viewMode,
    setViewMode,
  };
}
