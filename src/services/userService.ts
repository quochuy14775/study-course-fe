import api from '../lib/axios';
import type { UserActivity } from '../types/userActivity';
import type { UserOverview } from '../types/userOverview';

export interface UserProfile {
    email: string;
    userName: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
}

const userService = {
    getMe: async (): Promise<UserProfile> => {
        const res = await api.get<UserProfile>('/User/me');
        return res.data;
    },

    updateProfile: async (data: { fullName: string; avatarUrl?: string }): Promise<UserProfile> => {
        const res = await api.put<UserProfile>('/User/me', data);
        return res.data;
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
        await api.put('/User/change-password', data);
    },

    /** GET /api/User/me/activity?days= — contribution graph + streak của user đang đăng nhập */
    getMyActivity: async (days = 365): Promise<UserActivity> => {
        const res = await api.get<UserActivity>('/User/me/activity', { params: { days } });
        return res.data;
    },

    /** GET /api/User/me/overview — thống kê, kỹ năng, chứng chỉ, học tiếp, thành tích cho trang cá nhân */
    getMyOverview: async (): Promise<UserOverview> => {
        const res = await api.get<UserOverview>('/User/me/overview');
        return res.data;
    },
};

export default userService;
