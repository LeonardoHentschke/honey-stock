import { create } from 'zustand';

interface SettingsState {
  notifSale: boolean;
  notifReminders: boolean;
  notifWeeklySummary: boolean;
  flyingBeesEnabled: boolean;
  setNotifSale: (v: boolean) => void;
  setNotifReminders: (v: boolean) => void;
  setNotifWeeklySummary: (v: boolean) => void;
  setFlyingBeesEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  notifSale: true,
  notifReminders: true,
  notifWeeklySummary: false,
  // Desativado por padrão — decorativo, e não deve aparecer nas telas de login/cadastro.
  flyingBeesEnabled: false,
  setNotifSale: (v) => set({ notifSale: v }),
  setNotifReminders: (v) => set({ notifReminders: v }),
  setNotifWeeklySummary: (v) => set({ notifWeeklySummary: v }),
  setFlyingBeesEnabled: (v) => set({ flyingBeesEnabled: v }),
}));
