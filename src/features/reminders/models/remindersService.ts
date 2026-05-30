import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';
import type { Database } from '@/shared/types/database.types';
import type { CreateReminderValues } from './remindersSchemas';

type ReminderRow = Database['public']['Tables']['reminders']['Row'];

export type Reminder = ReminderRow;

export interface ReminderWithSale extends ReminderRow {
  sale: {
    scheduled_for: string | null;
    customer: { name: string } | null;
  } | null;
  recipients: { user_id: string }[];
}

export interface CompanyMember {
  id: string;
  full_name: string;
}

export const remindersService = {
  async list(companyId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['pending', 'failed'])
      .order('remind_at', { ascending: true });
    if (error) throw new ServiceError('Erro ao buscar lembretes.', error);
    return data ?? [];
  },

  async get(id: string): Promise<ReminderWithSale> {
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        sale:sales(
          scheduled_for,
          customer:customers(name)
        ),
        recipients:reminder_recipients(user_id)
      `)
      .eq('id', id)
      .single();
    if (error) throw new ServiceError('Lembrete não encontrado.', error);
    return data as unknown as ReminderWithSale;
  },

  async create(
    companyId: string,
    userId: string,
    input: CreateReminderValues
  ): Promise<Reminder> {
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert({
        company_id: companyId,
        created_by: userId,
        sale_id: input.saleId ?? null,
        title: input.title,
        body: input.body ?? null,
        remind_at: input.remindAt.toISOString(),
        status: 'pending',
      })
      .select('*')
      .single();
    if (reminderError) throw new ServiceError('Erro ao criar lembrete.', reminderError);

    const recipients = input.recipientIds.map((uid) => ({
      reminder_id: reminder.id,
      user_id: uid,
    }));
    const { error: recipientsError } = await supabase
      .from('reminder_recipients')
      .insert(recipients);
    if (recipientsError) {
      await supabase.from('reminders').delete().eq('id', reminder.id);
      throw new ServiceError('Erro ao salvar destinatários.', recipientsError);
    }

    return reminder;
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'canceled' })
      .eq('id', id);
    if (error) throw new ServiceError('Erro ao cancelar lembrete.', error);
  },

  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)
      .order('full_name');
    if (error) throw new ServiceError('Erro ao buscar membros.', error);
    return (data ?? []) as CompanyMember[];
  },
};
