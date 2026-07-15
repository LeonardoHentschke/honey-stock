import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';
import type { NewSaleValues } from './salesSchemas';

type SaleRow = Database['public']['Tables']['sales']['Row'];
type SaleItemRow = Database['public']['Tables']['sale_items']['Row'];

export type SaleStatus = 'scheduled' | 'completed' | 'delivered' | 'canceled';
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit' | 'other';

/** Status de pagamento derivado do total vs. soma dos pagamentos. */
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export type SalePayment = Database['public']['Tables']['sale_payments']['Row'];

export interface Sale extends SaleRow {
  customer: { name: string; type: string } | null;
  payments: { amount: number }[];
}

export interface SaleItemWithProduct extends SaleItemRow {
  product: { name: string } | null;
}

export interface SaleWithItems extends SaleRow {
  customer: { name: string; type: string; phone: string | null } | null;
  items: SaleItemWithProduct[];
  payments: SalePayment[];
}

// ─── Helpers de pagamento (puros) ────────────────────────────────────────────
type WithPayments = { total: number; payments?: { amount: number }[] | null };

/** Soma dos pagamentos registrados na venda. */
export function paidAmount(sale: WithPayments): number {
  return (sale.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
}

/** Quanto ainda falta receber (nunca negativo). */
export function balance(sale: WithPayments): number {
  return Math.max(0, Number(sale.total) - paidAmount(sale));
}

/** 'paid' | 'partial' | 'pending' — não considera cancelamento (o caller trata). */
export function paymentStatus(sale: WithPayments): PaymentStatus {
  const paid = paidAmount(sale);
  if (paid <= 0) return 'pending';
  if (paid >= Number(sale.total)) return 'paid';
  return 'partial';
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pago',
  partial: 'Parcial',
  pending: 'A receber',
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
      .select('*, customer:customers(name, type), payments:sale_payments(amount)')
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
          product:products(name)
        ),
        payments:sale_payments(*)
      `)
      .eq('id', id)
      .order('paid_at', { referencedTable: 'sale_payments', ascending: true })
      .single();
    if (error) throw new ServiceError('Venda não encontrada.', error);
    return data as unknown as SaleWithItems;
  },

  async listByCustomer(customerId: string): Promise<SaleWithItems[]> {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(name, type, phone),
        items:sale_items(
          *,
          product:products(name)
        ),
        payments:sale_payments(amount)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new ServiceError('Erro ao buscar compras do cliente.', error);
    return (data ?? []) as unknown as SaleWithItems[];
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
      product_id: item.productId,
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

    if (input.paidAmount > 0) {
      await supabase.from('sale_payments').insert({
        company_id: companyId,
        sale_id: sale.id,
        amount: input.paidAmount,
        method: input.paymentMethod,
        created_by: userId,
      });
    }

    return { ...sale, payments: input.paidAmount > 0 ? [{ amount: input.paidAmount }] : [] } as unknown as Sale;
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
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) {
      await supabase.from('sales').delete().eq('id', sale.id);
      throw new ServiceError('Erro ao salvar itens da venda agendada.', itemsError);
    }

    if (input.paidAmount > 0) {
      await supabase.from('sale_payments').insert({
        company_id: companyId,
        sale_id: sale.id,
        amount: input.paidAmount,
        method: input.paymentMethod,
        created_by: userId,
      });
    }

    return { ...sale, payments: input.paidAmount > 0 ? [{ amount: input.paidAmount }] : [] } as unknown as Sale;
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

  async registerPayment(input: {
    saleId: string;
    companyId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
    paidAt?: Date;
  }): Promise<void> {
    const { error } = await supabase.from('sale_payments').insert({
      company_id: input.companyId,
      sale_id: input.saleId,
      amount: input.amount,
      method: input.method,
      notes: input.notes ?? null,
      created_by: input.userId,
      ...(input.paidAt ? { paid_at: input.paidAt.toISOString() } : {}),
    });
    if (error) throw new ServiceError('Erro ao registrar pagamento.', error);
  },
};
