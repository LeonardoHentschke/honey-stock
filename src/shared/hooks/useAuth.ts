import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Identifica o caso "refresh token inválido / não encontrado", comum em dev ao
 * trocar de projeto Supabase ou limpar o banco: o SecureStore ainda guarda a
 * sessão antiga, que o novo backend não reconhece. Não é falha de rede/código.
 */
function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!(error instanceof AuthError)) return false;
  return /refresh token/i.test(error.message);
}

/**
 * Escuta mudanças de sessão do Supabase e sincroniza com o authStore.
 * Deve ser montado uma única vez no entry point (src/app/index.tsx).
 */
export function useAuthListener() {
  const { setSession, setProfile, setLoading, clearAuth } = useAuthStore(
    useShallow((s) => ({
      setSession: s.setSession,
      setProfile: s.setProfile,
      setLoading: s.setLoading,
      clearAuth: s.clearAuth,
    }))
  );

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        // Refresh token inválido/ausente (ex.: troca de projeto Supabase em dev,
        // ou sessão expirada). Não é erro de fato — só não há sessão válida.
        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            await supabase.auth.signOut().catch(() => {});
          } else {
            console.warn('[useAuth] getSession error:', error.message);
          }
          clearAuth();
          setLoading(false);
          return;
        }
        setSession(session);
        if (session) loadProfile(session.user.id);
        else setLoading(false);
      })
      .catch((err) => {
        console.warn('[useAuth] getSession failed:', err?.message ?? err);
        clearAuth();
        setLoading(false);
      });

    // Escutar mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        } else {
          clearAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    setLoading(true);
    console.log('[useAuth] loadProfile → userId:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    console.log('[useAuth] loadProfile → profile:', JSON.stringify(profile), '| error:', error?.message);
    setProfile(profile ?? null);
    setLoading(false);
  }
}

/** Hook de leitura — use nas telas e ViewModels */
export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      session: s.session,
      profile: s.profile,
      isLoading: s.isLoading,
      isAuthenticated: s.session !== null,
    }))
  );
}

/**
 * Recarrega o perfil do usuário no store a partir do banco.
 *
 * Use após criação de conta para garantir que o perfil esteja disponível
 * mesmo quando o onAuthStateChange disparou antes dos inserts terminarem
 * (race condition do signUp quando confirmação de e-mail está desabilitada).
 */
export async function reloadProfile(userId: string): Promise<void> {
  const { setProfile, setLoading } = useAuthStore.getState();
  setLoading(true);
  console.log('[useAuth] reloadProfile → userId:', userId);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log('[useAuth] reloadProfile → profile:', JSON.stringify(profile), '| error:', error?.message);
  setProfile(profile ?? null);
  setLoading(false);
}
