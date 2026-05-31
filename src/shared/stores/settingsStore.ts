import { create } from 'zustand';

interface SettingsState {
  notifSale: boolean;
  notifLowStock: boolean;
  notifReminders: boolean;
  notifWeeklySummary: boolean;
  lowStockAlert: boolean;
  setNotifSale: (v: boolean) => void;
  setNotifLowStock: (v: boolean) => void;
  setNotifReminders: (v: boolean) => void;
  setNotifWeeklySummary: (v: boolean) => void;
  setLowStockAlert: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  notifSale: true,
  notifLowStock: true,
  notifReminders: true,
  notifWeeklySummary: false,
  lowStockAlert: true,
  setNotifSale: (v) => set({ notifSale: v }),
  setNotifLowStock: (v) => set({ notifLowStock: v }),
  setNotifReminders: (v) => set({ notifReminders: v }),
  setNotifWeeklySummary: (v) => set({ notifWeeklySummary: v }),
  setLowStockAlert: (v) => set({ lowStockAlert: v }),
}));
