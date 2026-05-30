import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Título obrigatório.'),
  body: z.string().optional(),
  remindAt: z.date(),
  recipientIds: z.array(z.string().uuid()).min(1, 'Escolha ao menos um destinatário.'),
  saleId: z.string().uuid().nullable().optional(),
});

export type CreateReminderValues = z.infer<typeof createReminderSchema>;
