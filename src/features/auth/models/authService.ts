import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/shared/lib/supabase';
import { ServiceError } from '@/shared/lib/errors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mapeia erros do Supabase Auth para mensagens em PT-BR. */
function mapAuthError(error: unknown): string {
  if (error instanceof ServiceError) return error.message;

  const msg =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: string }).message).toLowerCase()
      : '';

  if (msg.includes('invalid_credentials') || msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('email_exists') || msg.includes('user already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (msg.includes('invalid_email') || msg.includes('email address') || msg.includes('valid email')) {
    return 'E-mail inválido.';
  }
  if (msg.includes('weak_password') || msg.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }

  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

// ─── signIn ───────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ServiceError(mapAuthError(error), error);
}

// ─── signUpOwner ──────────────────────────────────────────────────────────────

/**
 * Cria uma nova conta de dono de empresa.
 * Fluxo: auth.signUp → insert company → insert profile.
 *
 * ⚠️  Requer "Confirm email" DESABILITADO no Supabase (ou o usuário não terá
 *     sessão para executar os inserts). Em produção, usar um Edge Function
 *     com service_role para criação de empresa + perfil.
 */
export async function signUpOwner(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
): Promise<void> {
  // 1. Criar usuário
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (authError) throw new ServiceError(mapAuthError(authError), authError);

  const userId = authData.user?.id;
  if (!userId) {
    throw new ServiceError(
      'Conta criada — verifique seu e-mail para confirmar antes de entrar.',
    );
  }

  // 2. Criar empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName })
    .select('id')
    .single();

  if (companyError || !company) {
    throw new ServiceError(
      'Conta criada, mas houve um problema ao criar a empresa. Tente fazer login.',
      companyError,
    );
  }

  // 3. Criar perfil
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    company_id: company.id,
    full_name: fullName,
  });

  if (profileError) {
    throw new ServiceError(
      'Conta criada, mas houve um problema ao salvar seu perfil. Entre em contato com o suporte.',
      profileError,
    );
  }
}

// ─── signUpMember ─────────────────────────────────────────────────────────────

export async function signUpMember(
  email: string,
  password: string,
  fullName: string,
  inviteCode: string,
): Promise<void> {
  // 1. Criar usuário
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (authError) throw new ServiceError(mapAuthError(authError), authError);

  const userId = authData.user?.id;
  if (!userId) {
    throw new ServiceError(
      'Conta criada — verifique seu e-mail para confirmar antes de entrar.',
    );
  }

  // 2. Buscar empresa pelo código de convite (security definer)
  const { data: companyId, error: inviteError } = await supabase.rpc(
    'get_company_by_invite',
    { p_code: inviteCode.toUpperCase() },
  );

  if (inviteError || !companyId) {
    throw new ServiceError('Código de convite inválido ou expirado.', inviteError);
  }

  // 3. Criar perfil vinculado à empresa
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    company_id: companyId as string,
    full_name: fullName,
  });

  if (profileError) {
    throw new ServiceError(
      'Conta criada, mas houve um problema ao vincular à empresa. Tente novamente.',
      profileError,
    );
  }
}

// ─── signOut ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new ServiceError(mapAuthError(error), error);
}

// ─── resetPassword ────────────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  const redirectTo = makeRedirectUri({ scheme: 'melmanager', path: 'reset-password' });
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new ServiceError(mapAuthError(error), error);
}

// ─── signInWithGoogle ─────────────────────────────────────────────────────────

/**
 * OAuth com Google via expo-web-browser + PKCE.
 * Requer:
 *  - "scheme": "melmanager" em app.json  ✅
 *  - Provedor Google habilitado no Supabase Dashboard (Auth → Providers)
 *  - URL de callback configurada: melmanager://
 */
export async function signInWithGoogle(): Promise<void> {
  const redirectTo = makeRedirectUri({ scheme: 'melmanager' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    throw new ServiceError(mapAuthError(error ?? new Error('URL OAuth não retornada.')));
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw new ServiceError(mapAuthError(sessionError), sessionError);
  }
  // result.type === 'cancel' ou 'dismiss' — usuário fechou o browser, não fazer nada
}
