import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    id: string;
    username: string;
    role: "admin" | "MODERATOR" | "ADMIN" | "USER";
    date_of_birth?: string;
    is_18_plus?: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, access: string, refresh: string) => void;
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
