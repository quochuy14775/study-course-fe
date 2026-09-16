import { createContext, useContext } from 'react';
import type {
    AdminActionItemDto, AdminActivityDto, AdminActivityItemDto, AdminDashboardDto, AdminInboxDto,
    DashboardKpiId, FunnelStepId,
} from '../../../types/adminDashboard';
import {
    buildKpis, sliceRange, revenueMonthly as mockRevenue, revenueTarget as mockRevenueTarget,
    funnel as mockFunnel, passRates as mockPassRates, dropOffs as mockDropOffs, hardQuestions as mockHardQuestions,
    studyHeatmap as mockHeatmap, topCourses as mockTopCourses, levelDistribution as mockLevels,
    recentCertificates as mockCerts, topArticles as mockArticles, actionItems as mockActions,
    openQuestions as mockQuestions, lowReviews as mockReviews, recentActivity as mockActivity,
    type Range, type Kpi, type DailyPoint, type MonthlyRevenue, type FunnelStep, type PassRate, type DropOff,
    type HardQuestion, type TopCourse, type LevelSlice, type RecentCertificate, type TopArticle,
    type ActionItem, type OpenQuestion, type LowReview, type Activity,
} from '../../../mockDatas/mockAdminDashboard';

/* ─────────────────────────────────────────────────────────────
   View-model của dashboard — card chỉ đọc từ đây, không biết dữ liệu
   đến từ API hay mock.
   ───────────────────────────────────────────────────────────── */

export interface DashboardData {
    source: 'api' | 'mock';
    range: Range;
    kpis: Kpi[];
    daily: DailyPoint[];
    dailyPrevious: DailyPoint[];
    /** null khi BE chưa có bảng thanh toán → ẩn card doanh thu */
    revenueMonthly: MonthlyRevenue[] | null;
    revenueTarget: number | null;
    funnel: FunnelStep[];
    passRates: PassRate[];
    dropOffs: DropOff[];
    hardQuestions: HardQuestion[];
    heatmap: number[][];
    topCourses: TopCourse[];
    levelDistribution: LevelSlice[];
    recentCertificates: RecentCertificate[];
    topArticles: TopArticle[];
    actionItems: ActionItem[];
    openQuestions: OpenQuestion[];
    lowReviews: LowReview[];
    activity: Activity[];
    activityCursor: string | null;
}

export const DashboardContext = createContext<DashboardData | null>(null);

export const useDashboard = (): DashboardData => {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard phải dùng bên trong DashboardContext.Provider');
    return ctx;
};

/* ─────────────────────────────────────────────────────────────
   Nhãn hiển thị — BE chỉ trả id + số
   ───────────────────────────────────────────────────────────── */

const KPI_META: Record<DashboardKpiId, Pick<Kpi, 'label' | 'suffix' | 'format' | 'upIsGood' | 'to'>> = {
    learners:     { label: 'Học viên mới',    upIsGood: true },
    enrollments:  { label: 'Ghi danh',        upIsGood: true, to: '/management' },
    completions:  { label: 'Hoàn thành khóa', upIsGood: true },
    certificates: { label: 'Chứng chỉ cấp',   upIsGood: true, to: '/management/certificates' },
    avgScore:     { label: 'Điểm test TB',    upIsGood: true, suffix: '%', format: { minimumFractionDigits: 1, maximumFractionDigits: 1 } },
};

const FUNNEL_LABEL: Record<FunnelStepId, string> = {
    signup:   'Đăng ký',
    verified: 'Xác thực email',
    enrolled: 'Ghi danh khóa',
    finished: 'Hoàn thành ≥ 1 khóa',
    cert:     'Nhận chứng chỉ',
};

const LEVEL_LABEL: Record<LevelSlice['level'], string> = {
    Beginner: 'Cơ bản',
    Intermediate: 'Trung cấp',
    Advanced: 'Nâng cao',
};

/** Nút hành động cho từng loại việc tồn đọng. */
export const actionMeta = (a: Pick<AdminActionItemDto, 'kind' | 'courseId' | 'lessonId'>): Pick<ActionItem, 'cta' | 'to' | 'inline'> => {
    switch (a.kind) {
        case 'unanswered-questions': return { cta: 'Trả lời', inline: 'reply-questions' };
        case 'low-reviews':          return { cta: 'Phản hồi', inline: 'reply-reviews' };
        case 'no-lesson':            return { cta: 'Thêm bài học', to: `/management/courses/${a.courseId}/lessons` };
        case 'no-test':              return { cta: 'Tạo bài test', to: `/management/courses/${a.courseId}/lessons` };
        case 'no-image':             return { cta: 'Thêm ảnh', to: '/management' };
        case 'hidden':               return { cta: 'Bật lại', inline: 'enable' };
        default:                     return { cta: 'Xem', to: '/management' };
    }
};

const activityText = (a: AdminActivityItemDto): string => {
    const course = a.courseTitle ?? 'khóa học';
    switch (a.kind) {
        case 'enroll':         return `ghi danh ${course}`;
        case 'cert_issued':    return `nhận chứng chỉ ${course}${a.value != null ? ` với ${Math.round(a.value)} điểm` : ''}`;
        case 'review':         return `đánh giá ${a.value ?? '?'}★ cho ${course}`;
        case 'question':       return `đặt câu hỏi ở ${course}`;
        case 'course_created': return `tạo khóa học mới ${course}`;
        case 'course_updated': return `cập nhật ${course}`;
        default:               return course;
    }
};

export const mapActivity = (a: AdminActivityItemDto): Activity => ({
    id: a.id,
    kind: a.kind,
    text: activityText(a),
    by: a.actorName,
    at: a.createdAt,
});

/* ─────────────────────────────────────────────────────────────
   API → view-model
   ───────────────────────────────────────────────────────────── */

export const fromApi = (d: AdminDashboardDto, inbox: AdminInboxDto, activity: AdminActivityDto): DashboardData => {
    const toDaily = (p: AdminDashboardDto['daily'][number]): DailyPoint => ({
        date: p.date,
        enrollments: p.enrollments,
        signups: p.signups,
        certificates: p.certificates,
        revenue: 0,
    });

    return {
        source: 'api',
        range: d.range,
        kpis: d.kpis.map((k) => ({
            id: k.id,
            value: k.value,
            deltaPct: k.deltaPct,
            trend: k.trend,
            ...KPI_META[k.id],
            note: k.id === 'completions' ? `Tỉ lệ hoàn thành toàn hệ thống ${d.completionRate}%` : undefined,
        })),
        daily: d.daily.map(toDaily),
        dailyPrevious: d.dailyPrevious.map(toDaily),
        revenueMonthly: null,
        revenueTarget: null,
        funnel: d.funnel.map((s) => ({ id: s.id, label: FUNNEL_LABEL[s.id] ?? s.id, value: s.value })),
        passRates: d.passRates.map((p) => ({ courseId: p.courseId, title: p.title, attempts: p.attempts, passRate: p.passRate })),
        dropOffs: d.dropOffs.map((x) => ({
            courseId: x.courseId, title: x.courseTitle, lessonTitle: x.lessonTitle,
            lessonIndex: x.lessonIndex, lessonTotal: x.lessonTotal, dropPct: x.dropPct,
        })),
        hardQuestions: d.hardQuestions.map((q) => ({
            id: q.questionId, question: q.question, course: q.courseTitle, wrongPct: q.wrongPct, attempts: q.attempts,
        })),
        heatmap: d.studyHeatmap,
        topCourses: d.topCourses.map((c) => ({ ...c, revenue: 0 })),
        levelDistribution: d.levelDistribution.map((l) => ({ level: l.level, label: LEVEL_LABEL[l.level] ?? l.level, count: l.count })),
        recentCertificates: d.recentCertificates.map((c) => ({
            id: c.id, userName: c.userName, userEmail: c.userEmail ?? '', courseTitle: c.courseTitle,
            scorePercentage: c.scorePercentage, issuedAt: c.issuedAt,
        })),
        topArticles: d.topArticles.map((a) => ({ id: a.id, title: a.title, views: a.views })),
        actionItems: inbox.actionItems.map((a) => ({
            id: a.id, kind: a.kind, tone: a.tone, title: a.title, meta: a.meta,
            courseId: a.courseId, lessonId: a.lessonId ?? undefined,
            ...actionMeta(a),
        })),
        openQuestions: inbox.openQuestions.map((q) => ({
            id: q.id, user: q.userName, course: q.courseTitle, courseId: q.courseId,
            lessonId: q.lessonId, lesson: q.lessonTitle, text: q.content, askedAt: q.createdAt,
        })),
        lowReviews: inbox.lowReviews.map((r) => ({
            id: r.id, user: r.userName, course: r.courseTitle, courseId: r.courseId,
            rating: r.rating, text: r.content, at: r.createdAt,
        })),
        activity: activity.items.map(mapActivity),
        activityCursor: activity.nextCursor ?? null,
    };
};

/* ─────────────────────────────────────────────────────────────
   Mock → view-model (dev không có backend)
   ───────────────────────────────────────────────────────────── */

export const fromMock = (range: Range): DashboardData => {
    const { current, previous } = sliceRange(range);
    return {
        source: 'mock',
        range,
        kpis: buildKpis(range),
        daily: current,
        dailyPrevious: previous,
        revenueMonthly: mockRevenue,
        revenueTarget: mockRevenueTarget,
        funnel: mockFunnel,
        passRates: mockPassRates,
        dropOffs: mockDropOffs,
        hardQuestions: mockHardQuestions,
        heatmap: mockHeatmap,
        topCourses: mockTopCourses,
        levelDistribution: mockLevels,
        recentCertificates: mockCerts,
        topArticles: mockArticles,
        actionItems: mockActions,
        openQuestions: mockQuestions,
        lowReviews: mockReviews,
        activity: mockActivity,
        activityCursor: null,
    };
};
