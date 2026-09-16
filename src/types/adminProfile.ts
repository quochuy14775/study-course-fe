// Khớp với BE — StudyCourseAPI/DTOs/Responses/Admin/AdminProfileResponse.cs
import type { UserProfile } from '../services/userService';
import type { UserActivity } from './userActivity';

export interface AdminContribution {
    coursesCreated: number;
    coursesUpdated: number;
    lessonsInMyCourses: number;
    learnersInMyCourses: number;
    articlesWritten: number;
    answersGiven: number;
    reviewRepliesGiven: number;
}

export interface AdminSystemSnapshot {
    courses: number;
    activeCourses: number;
    learners: number;
    enrollments: number;
    certificatesIssued: number;
    pendingQuestions: number;
    pendingLowReviews: number;
    coursesWithoutTest: number;
}

export interface AdminOwnedCourse {
    id: number;
    title: string;
    imageUrl?: string | null;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    isActive: boolean;
    price: number;
    lessonCount: number;
    learners: number;
    rating: number;
    createdAt: string;
    updatedAt?: string | null;
}

export interface AdminRecentAction {
    kind: 'course_created' | 'course_updated' | 'article' | 'answer' | 'reply';
    title: string;
    courseId?: number | null;
    articleId?: number | null;
    lessonId?: number | null;
    at: string;
}

export interface AdminProfile {
    profile: UserProfile;
    joinedAt: string;
    contribution: AdminContribution;
    system: AdminSystemSnapshot;
    myCourses: AdminOwnedCourse[];
    recent: AdminRecentAction[];
    /** Hoạt động quản trị theo ngày — lessons = khóa, quizzes = bài viết, posts = trả lời/phản hồi, enrollments = roadmap */
    activity: UserActivity;
}
