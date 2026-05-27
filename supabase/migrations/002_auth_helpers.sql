-- =============================================================================
-- Honey Stock — Auth Helpers
-- Sprint 1: políticas de INSERT para signup + helper de convite
--
-- Aplicar no SQL Editor do Supabase APÓS o 001_initial.sql
-- =============================================================================

-- Usuário autenticado pode criar sua empresa (ainda sem profile)
create policy "auth_insert_company" on companies
  for insert with check (auth.uid() is not null);

-- Usuário pode criar seu próprio profile
create policy "auth_insert_profile" on profiles
  for insert with check (id = auth.uid());

-- Busca company_id por código de convite (security definer contorna RLS)
create or replace function get_company_by_invite(p_code text)
returns uuid
language sql security definer as $$
  select id from companies where invite_code = upper(trim(p_code)) limit 1;
$$;
