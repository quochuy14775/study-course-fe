import api from '../lib/axios';

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
};

export default userService;
