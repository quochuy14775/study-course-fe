import type { Course } from "./course";

// ────────────────────────────────────────────────────────────
// Enrollment — phải khớp BE EnrollmentResponse
// (StudyCourseAPI/DTOs/Responses/User/EnrollmentResponse.cs)
// ────────────────────────────────────────────────────────────

export interface Enrollment {
    courseId: number;
    enrolledAt: string;
    /** 0 → 100, BE tính từ số bài đã hoàn thành trên tổng số bài */
    progress: number;
    /** Chỉ true khi đã pass course test và được cấp chứng chỉ */
    isCompleted: boolean;
    completedAt?: string | null;
}

/** Một dòng trong "Khóa học của tôi" — BE EnrolledCourseResponse */
export interface EnrolledCourse extends Enrollment {
    course: Course;
}
