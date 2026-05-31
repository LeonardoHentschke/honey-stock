import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores/authStore';

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
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
