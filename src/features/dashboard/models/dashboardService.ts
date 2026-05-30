import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';

type RawSaleItem = {
  quantity: number;
  product_variants: { products: { name: string } | null } | null;
};

export type RawDelivery = {
  id: string;
  scheduled_for: string | null;
  total: number;
  customers: { name: string } | null;
  sale_items: RawSaleItem[];
};

export const dashboardService = {
  async getCompanyName(companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
    if (error) throw new ServiceError('Erro ao buscar empresa.', error);
    return data.name;
  },

  async getTodaySales(companyId: string): Promise<{ total: number; count: number }> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('sales')
      .select('total')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) throw new ServiceError('Erro ao buscar vendas de hoje.', error);

    const rows = data ?? [];
    return { total: rows.reduce((s, r) => s + r.total, 0), count: rows.length };
  },

  async getMonthSales(companyId: string): Promise<{ total: number; saleIds: string[] }> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data, error } = await supabase
      .from('sales')
      .select('id, total')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) throw new ServiceError('Erro ao buscar vendas do mês.', error);

    const rows = data ?? [];
    return {
      total: rows.reduce((s, r) => s + r.total, 0),
      saleIds: rows.map((r) => r.id),
    };
  },

  async getBestSeller(saleIds: string[]): Promise<string> {
    if (saleIds.length === 0) return '-';

    const { data, error } = await supabase
      .from('sale_items')
      .select('quantity, product_variants(products(name))')
      .in('sale_id', saleIds);
    if (error) throw new ServiceError('Erro ao buscar mais vendido.', error);

    const items = (data ?? []) as unknown as RawSaleItem[];
    const qtys: Record<string, number> = {};
    items.forEach((item) => {
      const name = item.product_variants?.products?.name;
      if (name) qtys[name] = (qtys[name] ?? 0) + item.quantity;
    });

    const top = Object.entries(qtys).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '-';
  },

  async getLowStockCount(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('stock_quantity, min_stock')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (error) throw new ServiceError('Erro ao buscar estoque.', error);

    return (data ?? []).filter((v) => v.stock_quantity <= v.min_stock).length;
  },

  async getPendingRemindersCount(companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('reminders')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .gte('remind_at', new Date().toISOString());
    if (error) throw new ServiceError('Erro ao buscar lembretes.', error);

    return count ?? 0;
  },

  async getNextDeliveries(companyId: string): Promise<RawDelivery[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('id, scheduled_for, total, customers(name), sale_items(quantity, product_variants(products(name)))')
      .eq('company_id', companyId)
      .eq('status', 'scheduled')
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5);
    if (error) throw new ServiceError('Erro ao buscar entregas agendadas.', error);

    return (data ?? []) as unknown as RawDelivery[];
  },
};
