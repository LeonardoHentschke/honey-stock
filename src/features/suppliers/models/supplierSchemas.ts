import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório.'),
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type SupplierValues = z.infer<typeof supplierSchema>;
