import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatCurrency } from '@/shared/lib/format';
import { dashboardService, type RawDelivery } from '../models/dashboardService';

export interface NextDelivery {
  id: string;
  when: string;
  customerName: string;
  itemsSummary: string;
  total: string;
}

export interface DashboardData {
  companyName: string;
  companyInitials: string;
  firstName: string;
  heroDate: string;
  todayRevenue: string;
  todaySalesCount: number;
  monthRevenue: string;
  bestSeller: string;
  lowStockCount: number;
  pendingRemindersCount: number;
  nextDeliveries: NextDelivery[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatHeroDate(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const dayMonth = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `Hoje · ${weekday} ${dayMonth}`;
}

function formatDeliveryDate(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(date, today)) return `Hoje · ${time}`;
  if (sameDay(date, tomorrow)) return `Amanhã · ${time}`;

  const wd = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const dm = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)} · ${dm}`;
}

function buildDelivery(sale: RawDelivery): NextDelivery {
  const summaryParts = sale.sale_items.slice(0, 2).map(
    (item) => `${item.quantity}× ${item.product_variants?.products?.name ?? '?'}`
  );
  const extra = sale.sale_items.length > 2 ? ` +${sale.sale_items.length - 2}` : '';
  return {
    id: sale.id,
    when: sale.scheduled_for ? formatDeliveryDate(sale.scheduled_for) : '',
    customerName: sale.customers?.name ?? 'Sem cliente',
    itemsSummary: summaryParts.join(' · ') + extra || '-',
    total: formatCurrency(sale.total),
  };
}

async function fetchDashboard(
  companyId: string,
  fullName: string
): Promise<DashboardData> {
  const [companyName, today, month, lowStockCount, pendingRemindersCount, rawDeliveries] =
    await Promise.all([
      dashboardService.getCompanyName(companyId),
      dashboardService.getTodaySales(companyId),
      dashboardService.getMonthSales(companyId),
      dashboardService.getLowStockCount(companyId),
      dashboardService.getPendingRemindersCount(companyId),
      dashboardService.getNextDeliveries(companyId),
    ]);

  const bestSeller = await dashboardService.getBestSeller(month.saleIds);

  return {
    companyName,
    companyInitials: getInitials(companyName),
    firstName: fullName.split(' ')[0],
    heroDate: formatHeroDate(),
    todayRevenue: formatCurrency(today.total),
    todaySalesCount: today.count,
    monthRevenue: formatCurrency(month.total),
    bestSeller,
    lowStockCount,
    pendingRemindersCount,
    nextDeliveries: rawDeliveries.map(buildDelivery),
  };
}

export function useDashboardViewModel() {
  const { profile } = useAuth();

  const query = useQuery<DashboardData, Error>({
    queryKey: ['dashboard', profile?.company_id],
    queryFn: () => fetchDashboard(profile!.company_id, profile!.full_name),
    enabled: !!profile,
    staleTime: 60_000,
  });

  const empty: DashboardData = {
    companyName: '',
    companyInitials: '',
    firstName: '',
    heroDate: formatHeroDate(),
    todayRevenue: formatCurrency(0),
    todaySalesCount: 0,
    monthRevenue: formatCurrency(0),
    bestSeller: '-',
    lowStockCount: 0,
    pendingRemindersCount: 0,
    nextDeliveries: [],
  };

  return {
    ...(query.data ?? empty),
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refresh: query.refetch,
  };
}
