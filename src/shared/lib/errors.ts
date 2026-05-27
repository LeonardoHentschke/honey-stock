import { PostgrestError } from '@supabase/supabase-js';

/**
 * Erro tipado para a camada de Service.
 * ViewModels capturam ServiceError e decidem o que mostrar na View.
 */
export class ServiceError extends Error {
  public readonly code?: string;
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: PostgrestError | unknown, code?: string) {
    super(message);
    this.name = 'ServiceError';
    this.originalError = originalError;
    this.code = code;
  }
}

/** Mensagens humanas para códigos Postgres comuns */
export function humanizeError(error: unknown): string {
  if (error instanceof ServiceError) return error.message;

  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;
    switch (pgError.code) {
      case '23505': return 'Esse registro já existe.';
      case '23503': return 'Este item está em uso e não pode ser removido.';
      case '42501': return 'Você não tem permissão para esta ação.';
      case 'PGRST116': return 'Registro não encontrado.';
    }
  }

  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
