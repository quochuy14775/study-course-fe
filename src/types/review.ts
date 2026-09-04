// Khớp với DTOs bên BE (StudyCourseAPI) — api/courses/{courseId}/reviews

export interface CourseReview {
    id: number;
    courseId: number;
    userId: number;
    author: string;
    avatarUrl?: string;
    rating: number; // 1-5
    content: string;
    createdAt: string;
    helpfulCount: number;
    markedHelpful: boolean;
    replies: ReviewReply[];
}

/** Trả lời một review — thường dùng để giảng viên/admin phản hồi học viên */
export interface ReviewReply {
    id: number;
    reviewId: number;
    userId: number;
    author: string;
    avatarUrl?: string;
    isInstructor?: boolean;
    content: string;
    createdAt: string;
}

export interface RatingBreakdown {
    average: number;
    total: number;
    /** số lượng đánh giá theo từng mức sao, key 1-5 */
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewRequest {
    rating: number;
    content: string;
}
