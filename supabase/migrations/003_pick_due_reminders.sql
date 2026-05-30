-- =============================================================================
-- Migration 003: RPC pick_due_reminders
-- Usada pelo Edge Function dispatch-reminders a cada minuto.
--
-- Atomicamente:
--   1. Seleciona lembretes pendentes vencidos (remind_at <= now())
--   2. Marca como 'sent' via UPDATE + RETURNING (evita re-pick)
--   3. Usa FOR UPDATE SKIP LOCKED para suportar chamadas concorrentes
--   4. Retorna dados necessários para o dispatch (title, body, destinatários)
-- =============================================================================

create or replace function pick_due_reminders(p_limit int default 100)
returns table (
  id            uuid,
  title         text,
  body          text,
  sale_id       uuid,
  recipient_ids uuid[]
)
language plpgsql
security definer
as $$
begin
  return query
  with locked as (
    select r.id
    from reminders r
    where r.status = 'pending'
      and r.remind_at <= now()
    order by r.remind_at asc
    limit p_limit
    for update skip locked
  ),
  marked as (
    update reminders r
    set status = 'sent', sent_at = now()
    from locked l
    where r.id = l.id
    returning r.id, r.title, r.body, r.sale_id
  )
  select
    m.id,
    m.title,
    m.body,
    m.sale_id,
    coalesce(
      array_agg(rr.user_id) filter (where rr.user_id is not null),
      '{}'::uuid[]
    ) as recipient_ids
  from marked m
  left join reminder_recipients rr on rr.reminder_id = m.id
  group by m.id, m.title, m.body, m.sale_id;
end;
$$;
