/**
 * Utilitários de formatação — sempre chamar na View, nunca no domínio.
 * Datas ficam como Date no domínio; moeda como number em BRL.
 */

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** R$ 1.234,56 */
export function formatCurrency(value: number): string {
  return BRL_FORMATTER.format(value);
}

/** 25/05/2026 */
export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

/** 25/05/2026 14:30 */
export function formatDateTime(date: Date): string {
  return DATETIME_FORMATTER.format(date);
}

/** "1,5 kg" ou "500 g" */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)} kg`;
  }
  return `${grams.toFixed(0)} g`;
}

/** "24 un" ou "2,5 kg" */
export function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'kg') {
    return `${quantity % 1 === 0 ? quantity.toFixed(0) : quantity.toFixed(3).replace(/\.?0+$/, '')} kg`;
  }
  return `${Math.floor(quantity)} un`;
}

/** Tempo relativo simples: "em 2h", "amanhã", "há 3 dias" */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMinutes) < 1) return 'agora';
  if (diffMinutes > 0 && diffMinutes < 60) return `em ${diffMinutes}min`;
  if (diffHours > 0 && diffHours < 24) return `em ${diffHours}h`;
  if (diffDays === 1) return 'amanhã';
  if (diffDays > 1 && diffDays < 7) return `em ${diffDays} dias`;
  if (diffMinutes < 0 && diffMinutes > -60) return `há ${Math.abs(diffMinutes)}min`;
  if (diffHours < 0 && diffHours > -24) return `há ${Math.abs(diffHours)}h`;
  if (diffDays === -1) return 'ontem';
  if (diffDays < -1) return `há ${Math.abs(diffDays)} dias`;
  return formatDate(date);
}
