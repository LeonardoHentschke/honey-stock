import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Product = Database['public']['Tables']['products']['Row'];

export interface CreateProductInput {
  name: string;
  description?: string | null;
  cost_price: number;
  sale_price: number;
  stock_quantity?: number;
  min_stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  is_active?: boolean;
}

export interface ProductFilters {
  search?: string;
  lowStockOnly?: boolean;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock: number;
}

export const productService = {
  async list(companyId: string, filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ServiceError('Erro ao buscar produtos.', error);

    const rows = data ?? [];

    if (filters?.lowStockOnly) {
      return rows.filter((p) => p.stock_quantity <= p.min_stock);
    }

    return rows;
  },

  async get(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new ServiceError('Produto não encontrado.', error);
    return data;
  },

  /** Produtos ativos — usado no PDV (busca de itens vendáveis). */
  async listActive(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');
    if (error) throw new ServiceError('Erro ao buscar produtos.', error);
    return data ?? [];
  },

  async lowStock(companyId: string): Promise<LowStockProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'min_stock');
    if (error) throw new ServiceError('Erro ao buscar estoque baixo.', error);
    return data ?? [];
  },

  async create(companyId: string, input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({ company_id: companyId, ...input })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar produto.', error);
    return data;
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar produto.', error);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao desativar produto.', error);
  },
};
