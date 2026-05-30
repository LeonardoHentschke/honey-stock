import { z } from 'zod';

export const HONEY_TYPES = [
  'Silvestre',
  'Eucalipto',
  'Laranjeira',
  'Cipó-uva',
  'Assa-peixe',
  'Outro',
] as const;

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  honey_type: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CreateProductValues = z.infer<typeof createProductSchema>;

export const createVariantSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório.'),
  packaging: z.string().min(1, 'Embalagem é obrigatória.'),
  unit: z.enum(['un', 'kg']),
  weight_grams: z.number().positive().nullable().optional(),
  cost_price: z.number().min(0, 'Custo não pode ser negativo.'),
  sale_price: z.number().positive('Preço de venda deve ser maior que zero.'),
  reseller_price: z.number().positive().nullable().optional(),
  min_stock: z.number().min(0, 'Estoque mínimo não pode ser negativo.'),
});

export type CreateVariantValues = z.infer<typeof createVariantSchema>;
