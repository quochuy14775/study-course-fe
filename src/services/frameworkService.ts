import api from "../lib/axios";
import type { Framework, FrameworkRequest } from "../types/framework";

const BASE = "/Frameworks";

// Module-level cache — shared across all components, invalidated on mutation
let _cache: Framework[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const frameworkService = {
    getFrameworks: async (): Promise<Framework[]> => {
        const now = Date.now();
        if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
        const response = await api.get<Framework[]>(BASE);
        _cache = response.data;
        _cacheTime = now;
        return _cache;
    },

    getFrameworkById: async (id: number): Promise<Framework> => {
        const response = await api.get<Framework>(`${BASE}/${id}`);
        return response.data;
    },

    createFramework: async (data: FrameworkRequest): Promise<Framework> => {
        const response = await api.post<Framework>(BASE, data);
        _cache = null;
        return response.data;
    },

    updateFramework: async (id: number, data: FrameworkRequest): Promise<Framework> => {
        const response = await api.put<Framework>(`${BASE}/${id}`, data);
        _cache = null;
        return response.data;
    },

    deleteFramework: async (id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${BASE}/${id}`);
        _cache = null;
        return response.data;
    },
};

export default frameworkService;
