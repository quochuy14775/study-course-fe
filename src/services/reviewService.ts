import api from '../lib/axios';
import type { CourseReview, ReviewReply, RatingBreakdown, ReviewRequest } from '../types/review';

const reviewsBase = (courseId: number) => `/courses/${courseId}/reviews`;

const reviewService = {
    getReviews: (courseId: number): Promise<CourseReview[]> =>
        api.get(reviewsBase(courseId)).then(r => r.data),

    getSummary: (courseId: number): Promise<RatingBreakdown> =>
        api.get(`${reviewsBase(courseId)}/summary`).then(r => r.data),

    createReview: (courseId: number, data: ReviewRequest): Promise<CourseReview> =>
        api.post(reviewsBase(courseId), data).then(r => r.data),

    deleteReview: (courseId: number, reviewId: number): Promise<void> =>
        api.delete(`${reviewsBase(courseId)}/${reviewId}`).then(r => r.data),

    toggleHelpful: (courseId: number, reviewId: number): Promise<{ markedHelpful: boolean; helpfulCount: number }> =>
        api.post(`${reviewsBase(courseId)}/${reviewId}/helpful`).then(r => r.data),

    addReply: (courseId: number, reviewId: number, content: string): Promise<ReviewReply> =>
        api.post(`${reviewsBase(courseId)}/${reviewId}/replies`, { content }).then(r => r.data),
};

export default reviewService;
