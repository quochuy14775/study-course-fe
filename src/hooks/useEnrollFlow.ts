import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import enrollmentService from '../services/enrollmentService';
import type { Course } from '../types/course';
import type { Enrollment } from '../types/enrollment';

/**
 * Luồng ghi danh khóa học miễn phí: mở dialog xác nhận → gọi API → vào trang học.
 * Dùng chung cho mọi chỗ có nút "Đăng ký" (trang chi tiết, card ở trang chủ, trang đã lưu)
 * để cả ba nơi hành xử giống nhau.
 *
 * @param onEnrolled gọi sau khi enroll thành công, để trang tự cập nhật state của nó.
 */
export const useEnrollFlow = (onEnrolled?: (enrollment: Enrollment) => void) => {
    const navigate = useNavigate();
    const [pendingCourse, setPendingCourse] = useState<Course | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    /** Mở dialog xác nhận cho khóa này. */
    const requestEnroll = useCallback((course: Course) => setPendingCourse(course), []);

    const cancelEnroll = useCallback(() => {
        if (!enrolling) setPendingCourse(null);
    }, [enrolling]);

    /** Xác nhận: ghi danh (idempotent) rồi điều hướng vào học. */
    const confirmEnroll = useCallback(async () => {
        if (!pendingCourse || enrolling) return;
        const courseId = pendingCourse.id;

        setEnrolling(true);
        try {
            const enrollment = await enrollmentService.enroll(courseId);
            onEnrolled?.(enrollment);
            setPendingCourse(null);
            navigate(`/courses/${courseId}/learn`);
        } catch (e: any) {
            // Không điều hướng khi enroll hỏng — nếu không khóa học sẽ không bao giờ
            // xuất hiện trong "Khóa học của tôi" mà user không hay biết.
            console.error(e);
            toast.error(e?.response?.data?.message ?? 'Không thể đăng ký khóa học. Vui lòng thử lại.');
        } finally {
            setEnrolling(false);
        }
    }, [pendingCourse, enrolling, onEnrolled, navigate]);

    return { pendingCourse, enrolling, requestEnroll, cancelEnroll, confirmEnroll };
};
