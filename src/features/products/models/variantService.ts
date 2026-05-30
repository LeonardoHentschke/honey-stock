import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { ProductVariant } from './productService';

export interface CreateVariantInput {
  sku: string;
  packaging?: string | null;
  unit?: string;
  weight_grams?: number | null;
  cost_price: number;
  sale_price: number;
  reseller_price?: number | null;
  min_stock?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  packaging?: string | null;
  unit?: string;
  weight_grams?: number | null;
  cost_price?: number;
  sale_price?: number;
  reseller_price?: number | null;
  min_stock?: number;
  is_active?: boolean;
}

export interface LowStockVariant {
  id: string;
  sku: string;
  packaging: string | null;
  stock_quantity: number;
  min_stock: number;
  product_name: string;
}

export interface ActiveVariant {
  id: string;
  sku: string;
  packaging: string | null;
  unit: string;
  sale_price: number;
  reseller_price: number | null;
  stock_quantity: number;
  product_id: string;
  product_name: string;
  honey_type: string | null;
}

export const variantService = {
  async listActive(companyId: string): Promise<ActiveVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, sku, packaging, unit, sale_price, reseller_price, stock_quantity, product_id, products(name, honey_type)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sku');
    if (error) throw new ServiceError('Erro ao buscar variantes.', error);
    return (data ?? []).map((row) => {
      const r = row as typeof row & { products: { name: string; honey_type: string | null } | null };
      return {
        id: r.id,
        sku: r.sku,
        packaging: r.packaging,
        unit: r.unit,
        sale_price: r.sale_price,
        reseller_price: r.reseller_price,
        stock_quantity: r.stock_quantity,
        product_id: r.product_id,
        product_name: r.products?.name ?? '',
        honey_type: r.products?.honey_type ?? null,
      };
    });
  },


  async create(
    companyId: string,
    productId: string,
    input: CreateVariantInput
  ): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({ company_id: companyId, product_id: productId, ...input })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar variante.', error);
    return data;
  },

  async update(id: string, input: UpdateVariantInput): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from('product_variants')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar variante.', error);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_variants')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao desativar variante.', error);
  },

  async lowStock(companyId: string): Promise<LowStockVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, sku, packaging, stock_quantity, min_stock, products(name)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'min_stock');
    if (error) throw new ServiceError('Erro ao buscar estoque baixo.', error);

    return (data ?? []).map((row) => {
      const r = row as typeof row & { products: { name: string } | null };
      return {
        id: r.id,
        sku: r.sku,
        packaging: r.packaging,
        stock_quantity: r.stock_quantity,
        min_stock: r.min_stock,
        product_name: r.products?.name ?? '',
      };
    });
  },
};
