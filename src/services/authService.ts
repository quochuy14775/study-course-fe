import api from "../lib/axios";


export const authService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/Auth/login', {email, password});
        // The API may return { token: ... } or just the token string
        const data = response.data;
        return data.token || data.Token || data;
    },
};