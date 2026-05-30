import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerType = 'final' | 'reseller';

export interface CustomerInput {
  name: string;
  type: CustomerType;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
  business_name?: string | null;
  reseller_discount_percent?: number | null;
}

export const customerService = {
  async list(companyId: string, type?: CustomerType): Promise<Customer[]> {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw new ServiceError('Erro ao buscar clientes.', error);
    return data ?? [];
  },

  async get(id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new ServiceError('Cliente não encontrado.', error);
    return data;
  },

  async create(companyId: string, input: CustomerInput): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        company_id: companyId,
        name: input.name,
        type: input.type,
        phone: input.phone ?? null,
        email: input.email ?? null,
        document: input.document ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
        business_name: input.business_name ?? null,
        reseller_discount_percent: input.reseller_discount_percent ?? null,
      })
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao criar cliente.', error);
    return data;
  },

  async update(id: string, input: Partial<CustomerInput>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: input.name,
        type: input.type,
        phone: input.phone ?? null,
        email: input.email ?? null,
        document: input.document ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
        business_name: input.business_name ?? null,
        reseller_discount_percent: input.reseller_discount_percent ?? null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('Erro ao atualizar cliente.', error);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao desativar cliente.', error);
  },

  async priceForCustomer(variantId: string, customerId: string): Promise<number> {
    const [variantResult, customerResult] = await Promise.all([
      supabase.from('product_variants').select('sale_price, reseller_price').eq('id', variantId).single(),
      supabase.from('customers').select('type, reseller_discount_percent').eq('id', customerId).single(),
    ]);

    if (variantResult.error) throw new ServiceError('Variante não encontrada.', variantResult.error);
    if (customerResult.error) throw new ServiceError('Cliente não encontrado.', customerResult.error);

    const variant = variantResult.data;
    const customer = customerResult.data;

    if (customer.type === 'reseller') {
      if (variant.reseller_price != null) return variant.reseller_price;
      if (customer.reseller_discount_percent != null) {
        return variant.sale_price * (1 - customer.reseller_discount_percent / 100);
      }
    }

    return variant.sale_price;
  },
};
