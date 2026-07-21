-- =============================================================================
-- Honey Stock — Grants para roles da API
--
-- Versões recentes do Supabase não concedem mais privilégios de DML
-- automaticamente para anon/authenticated/service_role em tabelas novas do
-- schema public (secure-by-default). Sem estes grants, qualquer request via
-- PostgREST falha com 42501 "permission denied for table ..." antes mesmo de
-- avaliar RLS — foi o que quebrou o signup (insert em companies).
--
-- A segurança por empresa continua garantida pelas policies de RLS;
-- anon fica de fora porque o app só acessa dados autenticado.
-- =============================================================================

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- Tabelas/sequences criadas em migrations futuras já nascem com os grants
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
