import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface User {
    role: string;
    exp: number;
    email: string;
    name: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,

    setToken: (token: string) => {
        try {
            const decodeFn = jwtDecode as unknown as (token: string) => any;
            const decoded: any = decodeFn(token);

            const role =
                decoded.role ||
                decoded.roles ||
                decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            const email =
                decoded.email ||
                decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
                '';
            const name =
                decoded.name ||
                decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                email;
            set({
                token,
                user: { role, exp: decoded.exp, email, name },
            });
        } catch {
            set({ token: null, user: null });
        }
    },

    logout: () => {
        localStorage.removeItem("auth-storage");
        set({ token: null, user: null });
    },
}));