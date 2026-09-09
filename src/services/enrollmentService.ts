import api from '../lib/axios';
import type { Enrollment, EnrolledCourse } from '../types/enrollment';

const enrollmentService = {
    /** POST /api/courses/{id}/enroll — idempotent, gọi lại trả về enrollment cũ */
    enroll: (courseId: number): Promise<Enrollment> =>
        api.post(`/courses/${courseId}/enroll`).then(r => r.data),

    /** GET /api/courses/{id}/enrollment — null khi user chưa đăng ký (BE trả 404) */
    getEnrollment: (courseId: number): Promise<Enrollment | null> =>
        api.get(`/courses/${courseId}/enrollment`)
            .then(r => r.data)
            .catch((e) => {
                if (e?.response?.status === 404) return null;
                throw e;
            }),

    /** GET /api/users/me/courses — khóa đã đăng ký kèm tiến độ, mới học gần nhất lên đầu */
    getMyCourses: (): Promise<EnrolledCourse[]> =>
        api.get('/users/me/courses').then(r => r.data),
};

export default enrollmentService;
