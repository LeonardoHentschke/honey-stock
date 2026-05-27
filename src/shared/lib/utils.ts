import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para compor class names com Tailwind (usado pelos componentes RNR).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
