import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
    user: any | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: any, access: string, refresh: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, access, refresh) => {
                localStorage.setItem("access_token", access);
                set({ user, accessToken: access, refreshToken: refresh });
            },
            logout: () => {
                localStorage.removeItem("access_token");
                set({ user: null, accessToken: null, refreshToken: null });
            },
        }),
        {
            name: "void-auth-storage",
        }
    )
);
