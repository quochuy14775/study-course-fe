// Khớp với BE — StudyCourseAPI/DTOs/Responses/User/UserOverviewResponse.cs
import type { UserProfile } from '../services/userService';

export interface UserStats {
    enrolledCourses: number;
    completedCourses: number;
    completionRate: number;
    lessonsCompleted: number;
    /** Tổng thời lượng bài đã hoàn thành (giây) */
    studySeconds: number;
    quizAttempts: number;
    quizPassed: number;
    quizPassRate: number;
    bestScore: number;
    certificates: number;
    activeDays: number;
}

export type RankId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserRank {
    id: RankId;
    label: string;
    minPoints: number;
    nextLabel?: string | null;
    nextMinPoints?: number | null;
}

export interface SkillProgress {
    kind: 'language' | 'framework';
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    completedLessons: number;
    totalLessons: number;
    progress: number;
}

export interface MyCertificate {
    id: number;
    courseId: number;
    courseTitle: string;
    userName: string;
    issuedAt: string;
    certificateCode: string;
    scorePercentage: number;
}

export interface ContinueCourse {
    courseId: number;
    title: string;
    imageUrl?: string | null;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    progress: number;
    lessonCount: number;
    completedLessons: number;
    nextLessonId?: number | null;
    nextLessonTitle?: string | null;
    lastActivityAt?: string | null;
}

export interface RecentEvent {
    kind: 'lesson' | 'quiz' | 'cert' | 'enroll';
    title: string;
    courseId: number;
    courseTitle: string;
    lessonId?: number | null;
    value?: number | null;
    passed?: boolean | null;
    at: string;
}

export interface Achievement {
    id: string;
    label: string;
    description: string;
    earned: boolean;
    progress: number;
    target: number;
}

export interface UserOverview {
    profile: UserProfile;
    joinedAt: string;
    stats: UserStats;
    points: number;
    rank: UserRank;
    currentStreak: number;
    longestStreak: number;
    streakSafeToday: boolean;
    skills: SkillProgress[];
    certificates: MyCertificate[];
    continueLearning: ContinueCourse[];
    recent: RecentEvent[];
    achievements: Achievement[];
}
