// widgets/sidebar/model/sidebar.store.ts
import { create } from 'zustand';
import type { MenuCategorySidebar } from '../lib/types/sidebar-menu.types';

interface SidebarMenuState {
  menu: MenuCategorySidebar[];
  setMenu: (menu: MenuCategorySidebar[]) => void;
}

export const useSidebarMenuStore = create<SidebarMenuState>((set) => ({
  menu: [],
  setMenu: (menu) => set({ menu }),
}));
