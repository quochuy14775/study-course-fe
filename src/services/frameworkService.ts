import api from "../lib/axios";
import type { Framework, FrameworkRequest } from "../types/framework";

const BASE = "/Frameworks";

const frameworkService = {
    getFrameworks: async (): Promise<Framework[]> => {
        const response = await api.get<Framework[]>(BASE);
        return response.data;
    },

    getFrameworkById: async (id: number): Promise<Framework> => {
        const response = await api.get<Framework>(`${BASE}/${id}`);
        return response.data;
    },

    createFramework: async (data: FrameworkRequest): Promise<Framework> => {
        const response = await api.post<Framework>(BASE, data);
        return response.data;
    },

    updateFramework: async (id: number, data: FrameworkRequest): Promise<Framework> => {
        const response = await api.put<Framework>(`${BASE}/${id}`, data);
        return response.data;
    },

    deleteFramework: async (id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${BASE}/${id}`);
        return response.data;
    },
};

export default frameworkService;
