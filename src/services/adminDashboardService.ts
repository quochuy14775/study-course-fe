import api from '../lib/axios';
import type { AdminActivityDto, AdminDashboardDto, AdminInboxDto, DashboardRange } from '../types/adminDashboard';
import type { AdminProfile } from '../types/adminProfile';

const BASE = '/admin';

const adminDashboardService = {
    /** GET /api/admin/dashboard?range= — toàn bộ số liệu tổng hợp theo khoảng thời gian */
    getDashboard: (range: DashboardRange): Promise<AdminDashboardDto> =>
        api.get<AdminDashboardDto>(`${BASE}/dashboard`, { params: { range } }).then((r) => r.data),

    /** GET /api/admin/inbox — việc tồn đọng, câu hỏi chưa trả lời, review thấp */
    getInbox: (): Promise<AdminInboxDto> =>
        api.get<AdminInboxDto>(`${BASE}/inbox`).then((r) => r.data),

    /** GET /api/admin/activity?before=&limit= — dòng hoạt động, cursor thời gian */
    getActivity: (before?: string | null, limit = 20): Promise<AdminActivityDto> =>
        api.get<AdminActivityDto>(`${BASE}/activity`, { params: { before: before ?? undefined, limit } }).then((r) => r.data),

    /** GET /api/admin/me/overview — trang cá nhân của admin đang đăng nhập */
    getMyProfile: (): Promise<AdminProfile> =>
        api.get<AdminProfile>(`${BASE}/me/overview`).then((r) => r.data),
};

export default adminDashboardService;
