import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: { id: string; name: string } | null;
}

export interface CreateProductInput {
  name: string;
  honey_type?: string | null;
  category_id?: string | null;
  description?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  honey_type?: string | null;
  category_id?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductFilters {
  search?: string;
  lowStockOnly?: boolean;
}

const VARIANT_SELECT = 'id, sku, packaging, unit, weight_grams, cost_price, sale_price, reseller_price, stock_quantity, min_stock, is_active, created_at, updated_at, product_id, company_id';

export const productService = {
  async list(companyId: string, filters?: ProductFilters): Promise<ProductWithVariants[]> {
    let query = supabase
      .from('products')
      .select(`*, category:categories(id, name), variants:product_variants(${VARIANT_SELECT})`)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ServiceError('Erro ao buscar produtos.', error);

    const rows = (data ?? []) as unknown as ProductWithVariants[];

    if (filters?.lowStockOnly) {
      return rows.filter((p) =>
        p.variants.some((v) => v.is_active && v.stock_quantity <= v.min_stock)
      );
    }

    return rows;
  },

  async get(id: string): Promise<ProductWithVariants> {
    const { data, error } = await supabase
      .from('products')
      .select(`*, category:categories(id, name), variants:product_variants(${VARIANT_SELECT})`)
      .eq('id', id)
      .single();
    if (error) throw new ServiceError('Produto não encontrado.', error);
    return data as unknown as ProductWithVariants;
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
