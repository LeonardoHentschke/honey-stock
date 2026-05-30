import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { reportsService } from '../models/reportsService';
import {
  CHANNEL_LABELS,
  PAYMENT_LABELS,
  type SaleChannel,
  type PaymentMethod,
} from '@/features/sales/models/salesService';

export type PeriodOption = '7d' | '30d' | 'month';

function getStartDate(period: PeriodOption): Date {
  const now = new Date();
  if (period === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // 'month'
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export interface SalesByDayPoint {
  day: number;
  label: string;
  total: number;
  [key: string]: unknown;
}

export interface TopVariantPoint {
  index: number;
  label: string;
  qty: number;
  [key: string]: unknown;
}

export interface BreakdownRow {
  key: string;
  label: string;
  total: number;
  pct: number;
}

export function useReportsViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';

  const [period, setPeriod] = useState<PeriodOption>('30d');

  const startDate = useMemo(() => getStartDate(period), [period]);
  const endDate = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const salesQuery = useQuery({
    queryKey: ['sales-report', companyId, period],
    queryFn: () => reportsService.getSalesInPeriod(companyId, startDate, endDate),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const saleIds = useMemo(
    () => (salesQuery.data ?? []).map((s) => s.id),
    [salesQuery.data]
  );

  const itemsQuery = useQuery({
    queryKey: ['sale-items-report', saleIds],
    queryFn: () => reportsService.getSaleItemsForSales(saleIds),
    enabled: saleIds.length > 0,
    staleTime: 60_000,
  });

  const lowStockQuery = useQuery({
    queryKey: ['low-stock-report', companyId],
    queryFn: () => reportsService.getLowStockVariants(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  // ─── Aggregations ────────────────────────────────────────────────────────────

  const salesSummary = useMemo(() => {
    const sales = salesQuery.data ?? [];
    const total = sales.reduce((s, r) => s + r.total, 0);
    const count = sales.length;
    return { total, count, avg: count > 0 ? total / count : 0 };
  }, [salesQuery.data]);

  const salesByDay = useMemo<SalesByDayPoint[]>(() => {
    const sales = salesQuery.data ?? [];
    if (sales.length === 0) return [];
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const day = s.created_at.slice(0, 10);
      map[day] = (map[day] ?? 0) + s.total;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, total], idx) => {
        const [, m, d] = dateStr.split('-');
        return { day: idx, label: `${d}/${m}`, total };
      });
  }, [salesQuery.data]);

  const topVariants = useMemo<TopVariantPoint[]>(() => {
    const items = itemsQuery.data ?? [];
    const qtys: Record<string, number> = {};
    items.forEach((item) => {
      const name = item.product_variants?.products?.name ?? item.product_variants?.sku ?? '?';
      qtys[name] = (qtys[name] ?? 0) + item.quantity;
    });
    return Object.entries(qtys)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, qty], index) => ({ index, label, qty }));
  }, [itemsQuery.data]);

  const byChannel = useMemo<BreakdownRow[]>(() => {
    const sales = salesQuery.data ?? [];
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      map[s.channel] = (map[s.channel] ?? 0) + s.total;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({
        key,
        label: CHANNEL_LABELS[key as SaleChannel] ?? key,
        total: value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [salesQuery.data]);

  const byPayment = useMemo<BreakdownRow[]>(() => {
    const sales = salesQuery.data ?? [];
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      map[s.payment_method] = (map[s.payment_method] ?? 0) + s.total;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({
        key,
        label: PAYMENT_LABELS[key as PaymentMethod] ?? key,
        total: value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [salesQuery.data]);

  const isLoading = salesQuery.isLoading || lowStockQuery.isLoading;
  const isRefetching = salesQuery.isRefetching;

  function refresh() {
    salesQuery.refetch();
    itemsQuery.refetch();
    lowStockQuery.refetch();
  }

  return {
    period,
    setPeriod,
    salesSummary,
    salesByDay,
    topVariants,
    byChannel,
    byPayment,
    lowStockVariants: lowStockQuery.data ?? [],
    isLoading,
    isRefetching,
    refresh,
  };
}
