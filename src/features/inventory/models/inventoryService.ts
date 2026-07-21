import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

export type MovementWithDetails = StockMovement;

export const inventoryService = {
  async listMovements(productId: string, limit = 30): Promise<MovementWithDetails[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new ServiceError('Erro ao buscar movimentações.', error);
    return (data ?? []) as unknown as MovementWithDetails[];
  },

  async listAllMovements(companyId: string, limit = 50): Promise<MovementWithProduct[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, product:products(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new ServiceError('Erro ao buscar movimentações.', error);
    return (data ?? []) as unknown as MovementWithProduct[];
  },
};

export interface MovementWithProduct extends StockMovement {
  product: { name: string } | null;
}
