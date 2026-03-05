// widgets/sidebar/model/sidebar.store.ts
import { create } from 'zustand';
import type { MenuCategorySidebar } from '../lib/types/sidebar-menu.types';

interface SidebarMenuState {
  menu: MenuCategorySidebar[];
  setMenu: (menu: MenuCategorySidebar[]) => void;
  updateItemUnreadCount: (path: string, unreadCount: number) => void;
}

export const useSidebarMenuStore = create<SidebarMenuState>((set) => ({
  menu: [],
  setMenu: (menu) => set({ menu }),
  updateItemUnreadCount: (path, unreadCount) => set((state) => {
    const updatedMenu = state.menu.map(category => ({
      ...category,
      menu: category.menu.map(item =>
        item.path === path ? { ...item, unreadCount } : item
      )
    }));
    return { menu: updatedMenu };
  }),
}));
