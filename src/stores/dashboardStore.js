import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  activeAccountId: null,
  isSidebarOpen: true,
  setActiveAccount: (id) => set({ activeAccountId: id }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));