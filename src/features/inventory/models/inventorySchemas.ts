import { z } from 'zod';

export const entrySchema = z.object({
  quantity: z.number().positive('Quantidade deve ser maior que zero.'),
  unit_cost: z.number().min(0).nullable().optional(),
  batch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const exitSchema = z.object({
  quantity: z.number().positive('Quantidade deve ser maior que zero.'),
  notes: z.string().nullable().optional(),
});

export const adjustSchema = z.object({
  new_quantity: z.number().min(0, 'Estoque não pode ser negativo.'),
  notes: z.string().nullable().optional(),
});

export type EntryValues = z.infer<typeof entrySchema>;
export type ExitValues = z.infer<typeof exitSchema>;
export type AdjustValues = z.infer<typeof adjustSchema>;
