import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Supplier = Database['public']['Tables']['suppliers']['Row'];

export interface SupplierInput {
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export const supplierService = {
  async get(id: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new ServiceError('Fornecedor não encontrado.', error);
    return data;
  },

  async list(companyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');
    if (error) throw new ServiceError('Erro ao buscar fornecedores.', error);
    return data ?? [];
  },

  async create(companyId: string, input: SupplierInput): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company_id: companyId,
        name: input.name,
        document: input.document ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar fornecedor.', error);
    return data;
  },

  async update(id: string, input: Partial<SupplierInput>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: input.name,
        document: input.document ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar fornecedor.', error);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao desativar fornecedor.', error);
  },
};
