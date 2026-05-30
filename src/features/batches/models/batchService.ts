import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Batch = Database['public']['Tables']['batches']['Row'];

export interface BatchInput {
  code: string;
  harvested_at?: string | null;
  expires_at?: string | null;
  notes?: string | null;
}

export const batchService = {
  async list(companyId: string): Promise<Batch[]> {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw new ServiceError('Erro ao buscar lotes.', error);
    return data ?? [];
  },

  async create(companyId: string, input: BatchInput): Promise<Batch> {
    const { data, error } = await supabase
      .from('batches')
      .insert({ company_id: companyId, ...input })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar lote.', error);
    return data;
  },

  async update(id: string, input: Partial<BatchInput>): Promise<Batch> {
    const { data, error } = await supabase
      .from('batches')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar lote.', error);
    return data;
  },
};
