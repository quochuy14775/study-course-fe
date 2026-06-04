import api from '../lib/axios';
import type { Article, ArticleRequest } from '../types/article';

const BASE = '/Articles';

const articleService = {
    getArticles: async (params?: { category?: string; search?: string }): Promise<Article[]> => {
        const qs = new URLSearchParams();
        if (params?.category) qs.set('category', params.category);
        if (params?.search)   qs.set('search',   params.search);
        const res = await api.get<Article[]>(`${BASE}${qs.toString() ? `?${qs}` : ''}`);
        return res.data;
    },

    getArticleById: async (id: number): Promise<Article> => {
        const res = await api.get<Article>(`${BASE}/${id}`);
        return res.data;
    },

    getArticleBySlug: async (slug: string): Promise<Article> => {
        const res = await api.get<Article>(`${BASE}/slug/${slug}`);
        return res.data;
    },

    getCategories: async (): Promise<string[]> => {
        const res = await api.get<string[]>(`${BASE}/categories`);
        return res.data;
    },

    /** Lấy bài viết của chính mình (yêu cầu đăng nhập) */
    getMyArticles: async (): Promise<Article[]> => {
        const res = await api.get<Article[]>(`${BASE}/mine`);
        return res.data;
    },

    /** Tạo bài viết — bất kỳ user đăng nhập */
    createArticle: async (data: ArticleRequest): Promise<Article> => {
        const res = await api.post<Article>(BASE, data);
        return res.data;
    },

    /** Sửa bài viết — chỉ owner hoặc Admin */
    updateArticle: async (id: number, data: ArticleRequest): Promise<Article> => {
        const res = await api.put<Article>(`${BASE}/${id}`, data);
        return res.data;
    },

    /** Xóa bài viết — chỉ owner hoặc Admin */
    deleteArticle: async (id: number): Promise<void> => {
        await api.delete(`${BASE}/${id}`);
    },

    incrementView: async (id: number): Promise<{ viewCount: number }> => {
        const res = await api.post<{ viewCount: number }>(`${BASE}/${id}/view`);
        return res.data;
    },
};

export default articleService;
