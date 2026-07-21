import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  description: z.string().nullable().optional(),
  sale_price: z.number().positive('Preço de venda deve ser maior que zero.'),
  cost_price: z.number().min(0, 'Custo não pode ser negativo.'),
});

export type CreateProductValues = z.infer<typeof createProductSchema>;
