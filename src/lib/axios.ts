import axios from 'axios';
import {useAuthStore} from "../stores/authStore";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL ,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
        // ensure headers object exists and set Authorization
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // token bị server từ chối (hết hạn/không hợp lệ) -> clear store để navbar/notification đồng bộ
        if (error.response?.status === 401 && useAuthStore.getState().token) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    },
);

export default api;