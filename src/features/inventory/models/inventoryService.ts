import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

export interface MovementWithDetails extends StockMovement {
  batch: { code: string } | null;
  supplier: { name: string } | null;
}

export interface EntryInput {
  companyId: string;
  variantId: string;
  quantity: number;
  unitCost?: number | null;
  supplierId?: string | null;
  batchId?: string | null;
  notes?: string | null;
  userId: string;
}

export interface ExitInput {
  companyId: string;
  variantId: string;
  quantity: number;
  notes?: string | null;
  userId: string;
}

export interface AdjustInput {
  companyId: string;
  variantId: string;
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
        variant_id: input.variantId,
        type: 'in',
        quantity: input.quantity,
        unit_cost: input.unitCost ?? null,
        supplier_id: input.supplierId ?? null,
        batch_id: input.batchId ?? null,
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
        variant_id: input.variantId,
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
        variant_id: input.variantId,
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

  async listMovements(variantId: string, limit = 30): Promise<MovementWithDetails[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, batch:batches(code), supplier:suppliers(name)')
      .eq('variant_id', variantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new ServiceError('Erro ao buscar movimentações.', error);
    return (data ?? []) as unknown as MovementWithDetails[];
  },
};
