import api from "../lib/axios";
import type { Chapter, ChapterRequest } from "../types/chapter";

const base = (courseId: number | string) => `/Courses/${courseId}/Chapters`;

const chapterService = {
    getChapters: async (courseId: number | string): Promise<Chapter[]> => {
        const response = await api.get<Chapter[]>(base(courseId));
        return response.data;
    },

    getChapterById: async (courseId: number | string, id: number): Promise<Chapter> => {
        const response = await api.get<Chapter>(`${base(courseId)}/${id}`);
        return response.data;
    },

    createChapter: async (courseId: number | string, data: ChapterRequest): Promise<Chapter> => {
        const response = await api.post<Chapter>(base(courseId), data);
        return response.data;
    },

    updateChapter: async (courseId: number | string, id: number, data: ChapterRequest): Promise<Chapter> => {
        const response = await api.put<Chapter>(`${base(courseId)}/${id}`, data);
        return response.data;
    },

    deleteChapter: async (courseId: number | string, id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${base(courseId)}/${id}`);
        return response.data;
    },

    disableChapters: async (courseId: number | string, ids: number[]): Promise<void> => {
        await api.put(`${base(courseId)}/disable`, ids);
    },

    enableChapters: async (courseId: number | string, ids: number[]): Promise<void> => {
        await api.put(`${base(courseId)}/enable`, ids);
    },
};

export default chapterService;
