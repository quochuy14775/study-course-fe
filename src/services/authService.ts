import api from "../lib/axios";

export const authService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/Auth/login', { email, password });
        const data = response.data;
        return data.token || data.Token || data;
    },

    register: async (email: string) => {
        const response = await api.post('/Auth/register', { email });
        return response.data;
    },

    verifyEmail: async (email: string, token: string) => {
        const response = await api.get('/Auth/verify-email', { params: { email, token } });
        return response.data;
    },

    setupAccount: async (email: string, username: string, password: string, fullName?: string) => {
        const response = await api.post('/Auth/setup-account', { email, username, password, fullName });
        return response.data;
    },
};
