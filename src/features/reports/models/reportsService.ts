import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { PaymentMethod } from '@/features/sales/models/salesService';

export interface RawSale {
  id: string;
  total: number;
  discount: number;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface RawSaleItem {
  quantity: number;
  sale_id: string;
  products: { name: string } | null;
}

export interface LowStockProduct {
  stock_quantity: number;
  min_stock: number;
  product_name: string;
}

export const reportsService = {
  async getSalesInPeriod(
    companyId: string,
    start: Date,
    end: Date
  ): Promise<RawSale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, discount, payment_method, created_at')
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: true });
    if (error) throw new ServiceError('Erro ao buscar vendas.', error);
    return (data ?? []) as RawSale[];
  },

  async getSaleItemsForSales(saleIds: string[]): Promise<RawSaleItem[]> {
    if (saleIds.length === 0) return [];
    const { data, error } = await supabase
      .from('sale_items')
      .select('quantity, sale_id, products(name)')
      .in('sale_id', saleIds);
    if (error) throw new ServiceError('Erro ao buscar itens de venda.', error);
    return (data ?? []) as unknown as RawSaleItem[];
  },

  async getLowStockProducts(companyId: string, limit = 10): Promise<LowStockProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('name, stock_quantity, min_stock')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (error) throw new ServiceError('Erro ao buscar estoque.', error);

    type Row = { name: string; stock_quantity: number; min_stock: number };
    const rows = (data ?? []) as unknown as Row[];

    return rows
      .filter((r) => r.stock_quantity <= r.min_stock)
      .sort((a, b) => {
        const ratioA = a.min_stock > 0 ? a.stock_quantity / a.min_stock : 0;
        const ratioB = b.min_stock > 0 ? b.stock_quantity / b.min_stock : 0;
        return ratioA - ratioB;
      })
      .slice(0, limit)
      .map((r) => ({
        stock_quantity: r.stock_quantity,
        min_stock: r.min_stock,
        product_name: r.name,
      }));
  },
};
