import api from '../lib/axios';

// Khớp với BE — StudyCourseAPI/DTOs/Responses/PublicStatsResponse.cs
export interface PublicStats {
    learners: number;
    activeCourses: number;
    lessons: number;
    enrollments: number;
    certificatesIssued: number;
    /** 0–5, 0 khi chưa có review */
    averageRating: number;
    /** 0–100 */
    completionRate: number;
    computedAt: string;
}

const statsService = {
    /** GET /api/stats/public — số liệu trang chủ, không cần đăng nhập, BE cache 5 phút */
    getPublic: async (): Promise<PublicStats> => {
        const res = await api.get<PublicStats>('/stats/public');
        return res.data;
    },
};

export default statsService;
