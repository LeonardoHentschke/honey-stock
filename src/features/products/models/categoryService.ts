import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];

export const categoryService = {
  async list(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw new ServiceError('Erro ao buscar categorias.', error);
    return data ?? [];
  },

  async create(companyId: string, name: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ company_id: companyId, name })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar categoria.', error);
    return data;
  },

  async update(id: string, name: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar categoria.', error);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new ServiceError('Erro ao remover categoria.', error);
  },
};
