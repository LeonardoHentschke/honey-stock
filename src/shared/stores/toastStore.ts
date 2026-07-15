import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastState {
  toast: ToastData | null;
  show: (toast: ToastData) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (toast) => set({ toast }),
  hide: () => set({ toast: null }),
}));
