import { create } from "zustand";
import type { UserType } from "../lib/types/user.types";

export interface UserStore {
    user: UserType | null;
    setUser: (user: UserType | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    setUser: (user) => set({ user: user })
}));
