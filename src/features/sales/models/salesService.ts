import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';
import type { NewSaleValues } from './salesSchemas';

type SaleRow = Database['public']['Tables']['sales']['Row'];
type SaleItemRow = Database['public']['Tables']['sale_items']['Row'];

export type SaleStatus = 'scheduled' | 'completed' | 'delivered' | 'canceled';
export type SaleChannel = 'store' | 'fair' | 'delivery' | 'resale' | 'other';
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit' | 'other';

export interface Sale extends SaleRow {
  customer: { name: string; type: string } | null;
}

export interface SaleItemWithVariant extends SaleItemRow {
  variant: {
    sku: string;
    packaging: string | null;
    product: { name: string } | null;
  } | null;
}

export interface SaleWithItems extends SaleRow {
  customer: { name: string; type: string; phone: string | null } | null;
  items: SaleItemWithVariant[];
}

export const CHANNEL_LABELS: Record<SaleChannel, string> = {
  store: 'Loja',
  fair: 'Feira',
  delivery: 'Entrega',
  resale: 'Revenda',
  other: 'Outro',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  credit: 'Fiado',
  other: 'Outro',
};

export const STATUS_LABELS: Record<SaleStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  delivered: 'Entregue',
  canceled: 'Cancelada',
};

export const salesService = {
  async list(companyId: string): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*, customer:customers(name, type)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new ServiceError('Erro ao buscar vendas.', error);
    return (data ?? []) as unknown as Sale[];
  },

  async get(id: string): Promise<SaleWithItems> {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(name, type, phone),
        items:sale_items(
          *,
          variant:product_variants(
            sku, packaging,
            product:products(name)
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw new ServiceError('Venda não encontrada.', error);
    return data as unknown as SaleWithItems;
  },

  async create(
    companyId: string,
    userId: string,
    input: NewSaleValues
  ): Promise<Sale> {
    const itemsTotal = input.items.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Math.max(0, itemsTotal - input.discount);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        company_id: companyId,
        user_id: userId,
        customer_id: input.customerId ?? null,
        channel: input.channel,
        payment_method: input.paymentMethod,
        status: 'completed',
        discount: input.discount,
        total,
        notes: input.notes ?? null,
      })
      .select('*, customer:customers(name, type)')
      .single();
    if (saleError) throw new ServiceError('Erro ao registrar venda.', saleError);

    const saleItems = input.items.map((item) => ({
      sale_id: sale.id,
      variant_id: item.variantId,
      batch_id: item.batchId ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) {
      // Rollback manual: remove a venda órfã
      await supabase.from('sales').delete().eq('id', sale.id);
      throw new ServiceError('Erro ao salvar itens da venda.', itemsError);
    }

    return sale as unknown as Sale;
  },

  async createScheduledSale(
    companyId: string,
    userId: string,
    input: NewSaleValues,
    scheduledFor: Date
  ): Promise<Sale> {
    const itemsTotal = input.items.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Math.max(0, itemsTotal - input.discount);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        company_id: companyId,
        user_id: userId,
        customer_id: input.customerId ?? null,
        channel: input.channel,
        payment_method: input.paymentMethod,
        status: 'scheduled',
        scheduled_for: scheduledFor.toISOString(),
        discount: input.discount,
        total,
        notes: input.notes ?? null,
      })
      .select('*, customer:customers(name, type)')
      .single();
    if (saleError) throw new ServiceError('Erro ao agendar venda.', saleError);

    const saleItems = input.items.map((item) => ({
      sale_id: sale.id,
      variant_id: item.variantId,
      batch_id: item.batchId ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) {
      await supabase.from('sales').delete().eq('id', sale.id);
      throw new ServiceError('Erro ao salvar itens da venda agendada.', itemsError);
    }

    return sale as unknown as Sale;
  },

  async markDelivered(saleId: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'delivered' })
      .eq('id', saleId);
    if (error) throw new ServiceError('Erro ao marcar venda como entregue.', error);
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'canceled' })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao cancelar venda.', error);
  },
};
