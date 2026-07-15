/**
 * Máscaras de input — aplicar na View (onChangeText). O domínio guarda valores
 * limpos: número em BRL para moeda, string só com dígitos/formatada para os demais.
 *
 * Cada `maskX` recebe o texto cru digitado e devolve o texto formatado.
 * Para moeda, use `maskCurrency` (exibição) + `currencyToNumber` (valor do domínio)
 * e `numberToCurrencyMask` para popular o campo a partir de um número existente.
 */

const onlyDigits = (v: string): string => v.replace(/\D/g, '');

/** 000.000.000-00 */
export function maskCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** 00.000.000/0000-00 */
export function maskCnpj(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** CPF (até 11 dígitos) ou CNPJ (acima disso) — para campos que aceitam ambos. */
export function maskCpfCnpj(v: string): string {
  return onlyDigits(v).length <= 11 ? maskCpf(v) : maskCnpj(v);
}

/** (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo) */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Máscara de moeda por acúmulo de centavos: os dígitos preenchem da direita
 * para a esquerda. Ex.: "2500" → "25,00", "123456" → "1.234,56". Sem prefixo
 * "R$" (o input o exibe à parte). String vazia → "".
 */
export function maskCurrency(v: string): string {
  const d = onlyDigits(v).replace(/^0+/, '');
  if (d.length === 0) return '';
  const padded = d.padStart(3, '0');
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${reais},${cents}`;
}

/** Texto de moeda mascarado → número em reais (1.234,56 → 1234.56). */
export function currencyToNumber(masked: string): number {
  const d = onlyDigits(masked);
  return d.length === 0 ? 0 : parseInt(d, 10) / 100;
}

/** Número em reais → texto mascarado (1234.56 → "1.234,56"). 0 → "". */
export function numberToCurrencyMask(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return maskCurrency(String(Math.round(n * 100)));
}
