import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  priceIsAdjusted: z.boolean().optional(),
});

export const newSaleSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Adicione ao menos um produto.'),
  customerId: z.string().uuid().nullable().optional(),
  paymentMethod: z.enum(['cash', 'card', 'pix', 'credit', 'other']),
  discount: z.number().nonnegative(),
  // Quanto já foi pago no ato da venda (0 = a prazo; = total = pago integralmente).
  paidAmount: z.number().nonnegative(),
  notes: z.string().optional(),
});

export const registerPaymentSchema = z.object({
  amount: z.number().positive('Informe um valor maior que zero.'),
  method: z.enum(['cash', 'card', 'pix', 'credit', 'other']),
  notes: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type NewSaleValues = z.infer<typeof newSaleSchema>;
export type RegisterPaymentValues = z.infer<typeof registerPaymentSchema>;
