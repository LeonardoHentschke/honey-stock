import { z } from 'zod';

export const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  packaging: z.string().nullable(),
  unit: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  batchId: z.string().uuid().nullable().optional(),
  priceIsAdjusted: z.boolean().optional(),
});

export const newSaleSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Adicione ao menos um produto.'),
  customerId: z.string().uuid().nullable().optional(),
  channel: z.enum(['store', 'fair', 'delivery', 'resale', 'other']),
  paymentMethod: z.enum(['cash', 'card', 'pix', 'credit', 'other']),
  discount: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type NewSaleValues = z.infer<typeof newSaleSchema>;
