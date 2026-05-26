// Update to use Create React App environment variable prefix and ensure header typing
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

export default api;