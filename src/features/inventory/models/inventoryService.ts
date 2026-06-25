import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
type StockMovementType = Database['public']['Enums']['stock_movement_type'];

export type MovementWithDetails = StockMovement;

export interface EntryInput {
  companyId: string;
  productId: string;
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
  userId: string;
}

export interface ExitInput {
  companyId: string;
  productId: string;
  quantity: number;
  notes?: string | null;
  userId: string;
}

export interface AdjustInput {
  companyId: string;
  productId: string;
  newQuantity: number;
  notes?: string | null;
  userId: string;
}

export const inventoryService = {
  async createEntry(input: EntryInput): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        company_id: input.companyId,
        product_id: input.productId,
        type: 'in',
        quantity: input.quantity,
        unit_cost: input.unitCost ?? null,
        notes: input.notes ?? null,
        user_id: input.userId,
      })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao registrar entrada.', error);
    return data;
  },

  async createExit(input: ExitInput): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        company_id: input.companyId,
        product_id: input.productId,
        type: 'out',
        quantity: input.quantity,
        notes: input.notes ?? null,
        user_id: input.userId,
      })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao registrar saída.', error);
    return data;
  },

  async createAdjustment(input: AdjustInput): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        company_id: input.companyId,
        product_id: input.productId,
        type: 'adjust',
        quantity: input.newQuantity,
        notes: input.notes ?? null,
        user_id: input.userId,
      })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao ajustar estoque.', error);
    return data;
  },

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

  async listAllMovements(
    companyId: string,
    type?: StockMovementType | null,
    limit = 50,
  ): Promise<MovementWithProduct[]> {
    let q = supabase
      .from('stock_movements')
      .select('*, product:products(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (type) q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw new ServiceError('Erro ao buscar movimentações.', error);
    return (data ?? []) as unknown as MovementWithProduct[];
  },
};

export interface MovementWithProduct extends StockMovement {
  product: { name: string } | null;
}
