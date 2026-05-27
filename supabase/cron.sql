-- =============================================================================
-- Honey Stock — Cron job para dispatch de lembretes
-- Executar no SQL Editor do Supabase APÓS criar o Edge Function
--
-- Substitua <PROJECT_REF> pelo ref do seu projeto (ex: xyzabcdefghij)
-- e configure o app.functions_secret via:
--   ALTER DATABASE postgres SET app.functions_secret = '<seu_secret>';
-- =============================================================================

select cron.schedule(
  'dispatch-reminders-every-minute',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.functions.supabase.co/dispatch-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.functions_secret')
      )
    );
  $$
);
