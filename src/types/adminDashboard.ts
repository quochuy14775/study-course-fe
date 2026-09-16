// Khớp với DTOs bên BE — StudyCourseAPI/DTOs/Responses/Admin/AdminDashboardResponse.cs,
// AdminInboxResponse.cs, AdminActivityResponse.cs

export type DashboardRange = '7d' | '30d' | '90d';

export type DashboardKpiId = 'learners' | 'enrollments' | 'completions' | 'certificates' | 'avgScore';

export interface DashboardKpiDto {
    id: DashboardKpiId;
    value: number;
    previous: number;
    deltaPct: number;
    trend: number[];
}

export interface DashboardDailyPointDto {
    /** yyyy-MM-dd (múi giờ VN) */
    date: string;
    enrollments: number;
    signups: number;
    certificates: number;
    completions: number;
}

export type FunnelStepId = 'signup' | 'verified' | 'enrolled' | 'finished' | 'cert';

export interface FunnelStepDto {
    id: FunnelStepId;
    value: number;
}

export interface CoursePassRateDto {
    courseId: number;
    title: string;
    attempts: number;
    passed: number;
    passRate: number;
}

export interface LessonDropOffDto {
    courseId: number;
    courseTitle: string;
    lessonId: number;
    lessonTitle: string;
    lessonIndex: number;
    lessonTotal: number;
    reached: number;
    stopped: number;
    dropPct: number;
}

export interface HardQuestionDto {
    questionId: number;
    question: string;
    courseId: number;
    courseTitle: string;
    attempts: number;
    wrong: number;
    wrongPct: number;
}

export interface TopCourseDto {
    id: number;
    title: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    enrollments: number;
}

export interface LevelSliceDto {
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    count: number;
}

export interface TopArticleDto {
    id: number;
    title: string;
    slug: string;
    views: number;
}

export interface CertificateAdminDto {
    id: number;
    courseId: number;
    courseTitle: string;
    userId: number;
    userName: string;
    userEmail?: string | null;
    certificateCode: string;
    issuedAt: string;
    scorePercentage: number;
}

export interface AdminDashboardDto {
    range: DashboardRange;
    from: string;
    to: string;
    kpis: DashboardKpiDto[];
    completionRate: number;
    daily: DashboardDailyPointDto[];
    dailyPrevious: DashboardDailyPointDto[];
    funnel: FunnelStepDto[];
    passRates: CoursePassRateDto[];
    dropOffs: LessonDropOffDto[];
    hardQuestions: HardQuestionDto[];
    /** [7][24] — 0 = Thứ 2 … 6 = CN */
    studyHeatmap: number[][];
    topCourses: TopCourseDto[];
    levelDistribution: LevelSliceDto[];
    recentCertificates: CertificateAdminDto[];
    topArticles: TopArticleDto[];
}

/* ── Inbox ─────────────────────────────────────────────────────── */

export type AdminActionKind = 'unanswered-questions' | 'low-reviews' | 'no-lesson' | 'no-test' | 'no-image' | 'hidden';
export type AdminActionTone = 'critical' | 'warning' | 'info';

export interface AdminActionItemDto {
    id: string;
    kind: AdminActionKind;
    tone: AdminActionTone;
    title: string;
    meta: string;
    courseId: number;
    courseTitle: string;
    lessonId?: number | null;
    count: number;
}

export interface OpenQuestionDto {
    id: number;
    userId: number;
    userName: string;
    courseId: number;
    courseTitle: string;
    lessonId: number;
    lessonTitle: string;
    content: string;
    answerCount: number;
    createdAt: string;
}

export interface LowReviewDto {
    id: number;
    userId: number;
    userName: string;
    courseId: number;
    courseTitle: string;
    rating: number;
    content: string;
    createdAt: string;
}

export interface AdminInboxDto {
    actionItems: AdminActionItemDto[];
    openQuestions: OpenQuestionDto[];
    lowReviews: LowReviewDto[];
}

/* ── Activity ──────────────────────────────────────────────────── */

export type AdminActivityKind = 'enroll' | 'cert_issued' | 'review' | 'question' | 'course_created' | 'course_updated';

export interface AdminActivityItemDto {
    id: string;
    kind: AdminActivityKind;
    actorName: string;
    courseId?: number | null;
    courseTitle?: string | null;
    lessonId?: number | null;
    value?: number | null;
    createdAt: string;
}

export interface AdminActivityDto {
    items: AdminActivityItemDto[];
    nextCursor?: string | null;
}
