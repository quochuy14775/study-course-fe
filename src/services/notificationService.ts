import api from '../lib/axios';
import type { AppNotification } from '../types/notification';

const BASE = '/Notifications';

const notificationService = {
    list: async (params?: { top?: number; unreadOnly?: boolean }): Promise<AppNotification[]> => {
        const qs = new URLSearchParams();
        if (params?.top) qs.set('top', String(params.top));
        if (params?.unreadOnly) qs.set('unreadOnly', 'true');
        const res = await api.get<AppNotification[]>(`${BASE}${qs.toString() ? `?${qs}` : ''}`);
        return res.data;
    },

    unreadCount: async (): Promise<number> => {
        const res = await api.get<{ count: number }>(`${BASE}/unread-count`);
        return res.data.count;
    },

    markRead: async (id: number): Promise<void> => {
        await api.put(`${BASE}/${id}/read`);
    },

    markAllRead: async (): Promise<void> => {
        await api.put(`${BASE}/read-all`);
    },

    remove: async (id: number): Promise<void> => {
        await api.delete(`${BASE}/${id}`);
    },

    clearAll: async (): Promise<void> => {
        await api.delete(`${BASE}/clear-all`);
    },
};

export default notificationService;
