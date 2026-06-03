import api from "../lib/axios";
import { buildODataQuery, ODataParams } from "../types/odata";
import type {
    Roadmap,
    RoadmapListResponse,
    RoadmapMutationResponse,
    RoadmapRequest,
} from "../types/roadmap";

const BASE = "/Roadmaps";

const roadmapService = {
    /** GET /api/Roadmaps with OData query */
    getRoadmaps: async (params?: ODataParams): Promise<RoadmapListResponse> => {
        const query = params ? buildODataQuery(params) : "$count=true";
        const response = await api.get<RoadmapListResponse>(`${BASE}?${query}`);
        return response.data;
    },

    /** GET /api/Roadmaps/{id} */
    getRoadmapById: async (id: number): Promise<Roadmap> => {
        const response = await api.get<Roadmap>(`${BASE}/${id}`);
        return response.data;
    },

    /** POST /api/Roadmaps */
    createRoadmap: async (data: RoadmapRequest): Promise<Roadmap> => {
        const response = await api.post<RoadmapMutationResponse>(BASE, data);
        return response.data.data;
    },

    /** PUT /api/Roadmaps/{id} */
    updateRoadmap: async (id: number, data: RoadmapRequest): Promise<Roadmap> => {
        const response = await api.put<RoadmapMutationResponse>(`${BASE}/${id}`, data);
        return response.data.data;
    },

    /** PUT /api/Roadmaps/delete — bulk soft-delete */
    deleteRoadmaps: async (ids: number[]): Promise<{ success: boolean; deleted: number }> => {
        const response = await api.put(`${BASE}/delete`, ids);
        return response.data;
    },

    /** PUT /api/Roadmaps/disable */
    disableRoadmaps: async (ids: number[]): Promise<void> => {
        await api.put(`${BASE}/disable`, ids);
    },

    /** PUT /api/Roadmaps/enable */
    enableRoadmaps: async (ids: number[]): Promise<void> => {
        await api.put(`${BASE}/enable`, ids);
    },
};

export default roadmapService;
