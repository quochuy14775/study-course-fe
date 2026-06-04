import api from "../lib/axios";
import type { Language, LanguageRequest } from "../types/language";

const BASE = "/Languages";

// Module-level cache — shared across all components, invalidated on mutation
let _cache: Language[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const languageService = {
    getLanguages: async (): Promise<Language[]> => {
        const now = Date.now();
        if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
        const response = await api.get<Language[]>(BASE);
        _cache = response.data;
        _cacheTime = now;
        return _cache;
    },

    getLanguageById: async (id: number): Promise<Language> => {
        const response = await api.get<Language>(`${BASE}/${id}`);
        return response.data;
    },

    createLanguage: async (data: LanguageRequest): Promise<Language> => {
        const response = await api.post<Language>(BASE, data);
        _cache = null;
        return response.data;
    },

    updateLanguage: async (id: number, data: LanguageRequest): Promise<Language> => {
        const response = await api.put<Language>(`${BASE}/${id}`, data);
        _cache = null;
        return response.data;
    },

    deleteLanguage: async (id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${BASE}/${id}`);
        _cache = null;
        return response.data;
    },
};

export default languageService;
