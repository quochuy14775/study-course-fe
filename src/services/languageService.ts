import api from "../lib/axios";
import type { Language, LanguageRequest } from "../types/language";

const BASE = "/Languages";

const languageService = {
    getLanguages: async (): Promise<Language[]> => {
        const response = await api.get<Language[]>(BASE);
        return response.data;
    },

    getLanguageById: async (id: number): Promise<Language> => {
        const response = await api.get<Language>(`${BASE}/${id}`);
        return response.data;
    },

    createLanguage: async (data: LanguageRequest): Promise<Language> => {
        const response = await api.post<Language>(BASE, data);
        return response.data;
    },

    updateLanguage: async (id: number, data: LanguageRequest): Promise<Language> => {
        const response = await api.put<Language>(`${BASE}/${id}`, data);
        return response.data;
    },

    deleteLanguage: async (id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${BASE}/${id}`);
        return response.data;
    },
};

export default languageService;
