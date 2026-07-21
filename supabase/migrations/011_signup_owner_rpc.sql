-- =============================================================================
-- Honey Stock — RPC de signup do dono
--
-- O fluxo antigo (insert companies → insert profiles pelo client) quebrava:
-- o `insert ... returning id` exige que a linha passe pela policy de SELECT
-- (id = current_company_id()), mas o usuário recém-criado ainda não tem
-- profile — current_company_id() é null e o insert falha com 42501.
--
-- Esta função security definer cria empresa + profile atomicamente.
-- =============================================================================

create or replace function public.signup_owner(p_company_name text, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'profile_already_exists';
  end if;

  insert into companies (name) values (p_company_name) returning id into v_company_id;

  insert into profiles (id, company_id, full_name)
  values (auth.uid(), v_company_id, p_full_name);

  return v_company_id;
end;
$$;

revoke execute on function public.signup_owner(text, text) from public, anon;
grant execute on function public.signup_owner(text, text) to authenticated;
