import { create } from 'zustand';

interface SidebarToggleState {
  isOpen: boolean;
  isAnimated: boolean;
  setOpen: (isOpen: boolean) => void;
  setIsAnimated: (isAnimated: boolean) => void;
}

export const useSidebarToggleStore = create<SidebarToggleState>((set) => ({
  isOpen: false,
  isAnimated: false,
  setOpen: (isOpen) => set({ isOpen }),
  setIsAnimated: (isAnimated) => set({ isAnimated }),
}));
