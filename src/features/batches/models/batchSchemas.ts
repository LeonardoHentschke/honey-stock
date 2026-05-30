import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isoDate = z
  .string()
  .regex(ISO_DATE_RE, 'Data inválida. Use o formato DD/MM/AAAA.')
  .nullable()
  .optional();

export const batchSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório.'),
  harvested_at: isoDate,
  expires_at: isoDate,
  notes: z.string().nullable().optional(),
});

export type BatchValues = z.infer<typeof batchSchema>;
