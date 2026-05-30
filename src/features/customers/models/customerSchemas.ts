import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório.'),
  type: z.enum(['final', 'reseller']),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  document: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  business_name: z.string().nullable().optional(),
  reseller_discount_percent: z.number().min(0).max(100).nullable().optional(),
});

export type CustomerValues = z.infer<typeof customerSchema>;
