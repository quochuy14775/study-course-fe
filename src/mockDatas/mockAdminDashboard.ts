/**
 * Dữ liệu mẫu cho Admin Dashboard.
 * Backend hiện chưa có endpoint tổng hợp (/api/admin/dashboard?range=30d) — khi có,
 * thay các hàm/hằng này bằng response thật; shape đã đặt gần với thứ BE nên trả về.
 *
 * Mọi chuỗi theo ngày được sinh deterministic (PRNG có seed) để reload không đổi số.
 */

export type Range = '7d' | '30d' | '90d';
export const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };
export const RANGE_LABEL: Record<Range, string> = { '7d': '7 ngày', '30d': '30 ngày', '90d': '90 ngày' };

/** Mốc "hôm nay" cố định để số liệu mẫu ổn định. */
export const TODAY = new Date('2026-09-15T00:00:00');

/* ── PRNG ─────────────────────────────────────────────────────── */

const mulberry32 = (seed: number) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() - n);
    return d;
};

/* ── Chuỗi theo ngày (180 ngày) ───────────────────────────────── */

export interface DailyPoint {
    /** ISO yyyy-mm-dd */
    date: string;
    enrollments: number;
    signups: number;
    /** VNĐ */
    revenue: number;
    certificates: number;
}

const buildDaily = (): DailyPoint[] => {
    const rnd = mulberry32(20260915);
    const N = 180;
    const out: DailyPoint[] = [];
    for (let i = N - 1; i >= 0; i--) {
        const d = daysAgo(i);
        const dow = d.getDay(); // 0 = CN
        const weekend = dow === 0 || dow === 6 ? 0.62 : 1;
        const trend = 1 + (N - 1 - i) * 0.0032;           // tăng ~0.3%/ngày
        const noise = 0.82 + rnd() * 0.36;
        const enrollments = Math.round(46 * weekend * trend * noise);
        const signups = Math.round(enrollments * (0.55 + rnd() * 0.2));
        const paid = Math.round(enrollments * (0.17 + rnd() * 0.08));
        const revenue = paid * (399000 + Math.round(rnd() * 3) * 100000);
        const certificates = Math.round(enrollments * (0.12 + rnd() * 0.08));
        out.push({ date: isoDay(d), enrollments, signups, revenue, certificates });
    }
    return out;
};

export const daily: DailyPoint[] = buildDaily();

/** Cắt chuỗi theo range: kỳ hiện tại + kỳ liền trước (cùng độ dài) để so sánh. */
export const sliceRange = (range: Range) => {
    const n = RANGE_DAYS[range];
    const current = daily.slice(daily.length - n);
    const previous = daily.slice(daily.length - 2 * n, daily.length - n);
    return { current, previous };
};

export const sum = (arr: DailyPoint[], key: keyof Omit<DailyPoint, 'date'>) => arr.reduce((s, p) => s + p[key], 0);
export const pctChange = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / prev) * 100);

/* ── KPI ─────────────────────────────────────────────────────── */

export interface Kpi {
    id: string;
    label: string;
    value: number;
    /** Chuỗi đứng sau số, vd "%", "M ₫" */
    suffix?: string;
    format?: Intl.NumberFormatOptions;
    deltaPct: number;
    upIsGood: boolean;
    /** 12 điểm sparkline */
    trend: number[];
    note?: string;
    /** Trang drill-down khi bấm */
    to?: string;
}

const spark = (arr: DailyPoint[], key: keyof Omit<DailyPoint, 'date'>): number[] => {
    // gom về 12 điểm bằng nhau
    const bucket = Math.max(1, Math.floor(arr.length / 12));
    const pts: number[] = [];
    for (let i = 0; i < 12; i++) {
        const slice = arr.slice(i * bucket, (i + 1) * bucket);
        pts.push(slice.reduce((s, p) => s + p[key], 0));
    }
    return pts;
};

export const buildKpis = (range: Range): Kpi[] => {
    const { current, previous } = sliceRange(range);
    const enroll = sum(current, 'enrollments');
    const enrollPrev = sum(previous, 'enrollments');
    const revenue = sum(current, 'revenue');
    const revenuePrev = sum(previous, 'revenue');
    const certs = sum(current, 'certificates');
    const certsPrev = sum(previous, 'certificates');
    const signups = sum(current, 'signups');
    const signupsPrev = sum(previous, 'signups');
    const completion = range === '7d' ? 64.2 : range === '30d' ? 62.8 : 61.1;
    const avgScore = range === '7d' ? 82.6 : range === '30d' ? 81.4 : 80.9;

    return [
        {
            id: 'learners', label: 'Học viên mới', value: signups,
            deltaPct: pctChange(signups, signupsPrev), upIsGood: true,
            trend: spark(current, 'signups'), note: `Tổng ${(12480).toLocaleString('vi-VN')} học viên`,
        },
        {
            id: 'enrollments', label: 'Ghi danh', value: enroll,
            deltaPct: pctChange(enroll, enrollPrev), upIsGood: true,
            trend: spark(current, 'enrollments'), note: `${(enroll / RANGE_DAYS[range]).toFixed(1)} / ngày`, to: '/management',
        },
        {
            id: 'revenue', label: 'Doanh thu', value: revenue / 1_000_000, suffix: 'M ₫',
            format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
            deltaPct: pctChange(revenue, revenuePrev), upIsGood: true,
            trend: spark(current, 'revenue'), note: `${Math.round(revenue / enroll / 1000)}k ₫ / ghi danh`,
        },
        {
            id: 'completion', label: 'Tỉ lệ hoàn thành', value: completion, suffix: '%',
            format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
            deltaPct: 2.1, upIsGood: true,
            trend: [58, 59, 60, 59, 61, 62, 61, 63, 62, 64, 63, completion], note: 'Học viên xong ≥ 80% bài',
        },
        {
            id: 'certificates', label: 'Chứng chỉ cấp', value: certs,
            deltaPct: pctChange(certs, certsPrev), upIsGood: true,
            trend: spark(current, 'certificates'), note: 'Tự động sau test cuối', to: '/management/certificates',
        },
        {
            id: 'score', label: 'Điểm test TB', value: avgScore, suffix: '%',
            format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
            deltaPct: -0.8, upIsGood: true,
            trend: [80, 81, 82, 81, 83, 82, 82, 81, 82, 81, 82, avgScore], note: 'Ngưỡng đạt 70%',
        },
    ];
};

/* ── Doanh thu 12 tháng ───────────────────────────────────────── */

export interface MonthlyRevenue {
    /** "2025-10" */
    month: string;
    label: string;
    value: number; // VNĐ
    isCurrent?: boolean;
}

export const revenueTarget = 200_000_000;

export const revenueMonthly: MonthlyRevenue[] = (() => {
    const rnd = mulberry32(77);
    const out: MonthlyRevenue[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
        const base = 96 + (11 - i) * 8.2;
        const value = Math.round((base * (0.9 + rnd() * 0.2)) * 1_000_000);
        out.push({
            month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: `T${d.getMonth() + 1}`,
            value: i === 0 ? 186_500_000 : value,
            isCurrent: i === 0,
        });
    }
    return out;
})();

/* ── Funnel ───────────────────────────────────────────────────── */

export interface FunnelStep {
    id: string;
    label: string;
    value: number;
}

export const funnel: FunnelStep[] = [
    { id: 'signup',   label: 'Đăng ký',            value: 3240 },
    { id: 'verified', label: 'Xác thực email',     value: 2870 },
    { id: 'enrolled', label: 'Ghi danh khóa',      value: 2310 },
    { id: 'finished', label: 'Hoàn thành ≥ 1 khóa', value: 1120 },
    { id: 'cert',     label: 'Nhận chứng chỉ',     value: 812 },
    { id: 'pro',      label: 'Mua Pro',            value: 486 },
];

/* ── Chất lượng học tập ───────────────────────────────────────── */

export interface PassRate {
    courseId: number;
    title: string;
    attempts: number;
    passRate: number; // %
}

export const passRates: PassRate[] = [
    { courseId: 1, title: 'Introduction to React',         attempts: 412, passRate: 92 },
    { courseId: 3, title: 'Git & GitHub cho người mới',    attempts: 188, passRate: 88 },
    { courseId: 2, title: 'JavaScript Fundamentals',       attempts: 356, passRate: 84 },
    { courseId: 6, title: 'TypeScript chuyên sâu',         attempts: 141, passRate: 71 },
    { courseId: 5, title: 'Advanced React Patterns',       attempts: 203, passRate: 58 },
    { courseId: 7, title: 'Node.js & REST API thực chiến', attempts: 97,  passRate: 47 },
];

export interface DropOff {
    courseId: number;
    title: string;
    lessonTitle: string;
    lessonIndex: number;
    lessonTotal: number;
    /** % học viên dừng lại tại bài này */
    dropPct: number;
}

export const dropOffs: DropOff[] = [
    { courseId: 5, title: 'Advanced React Patterns',       lessonTitle: 'Render props & HOC',        lessonIndex: 9,  lessonTotal: 24, dropPct: 31 },
    { courseId: 7, title: 'Node.js & REST API thực chiến', lessonTitle: 'JWT & refresh token',       lessonIndex: 14, lessonTotal: 30, dropPct: 27 },
    { courseId: 6, title: 'TypeScript chuyên sâu',         lessonTitle: 'Conditional types',         lessonIndex: 11, lessonTotal: 20, dropPct: 22 },
    { courseId: 2, title: 'JavaScript Fundamentals',       lessonTitle: 'Promise & async/await',     lessonIndex: 12, lessonTotal: 18, dropPct: 14 },
    { courseId: 1, title: 'Introduction to React',         lessonTitle: 'useEffect & vòng đời',      lessonIndex: 7,  lessonTotal: 12, dropPct: 9 },
];

export interface HardQuestion {
    id: number;
    question: string;
    course: string;
    wrongPct: number;
    attempts: number;
}

export const hardQuestions: HardQuestion[] = [
    { id: 1, question: 'Kết quả của `typeof null` là gì?',                       course: 'JavaScript Fundamentals', wrongPct: 68, attempts: 340 },
    { id: 2, question: 'useEffect cleanup chạy khi nào?',                       course: 'Introduction to React',   wrongPct: 61, attempts: 398 },
    { id: 3, question: 'Sự khác nhau giữa `interface` và `type`',              course: 'TypeScript chuyên sâu',   wrongPct: 57, attempts: 132 },
    { id: 4, question: 'Refresh token nên lưu ở đâu?',                          course: 'Node.js & REST API',      wrongPct: 54, attempts: 91 },
    { id: 5, question: 'Khi nào dùng useMemo thay vì useCallback?',             course: 'Advanced React Patterns', wrongPct: 49, attempts: 197 },
    { id: 6, question: '`git rebase` khác `git merge` ở điểm nào?',             course: 'Git & GitHub',            wrongPct: 44, attempts: 180 },
];

/* ── Heatmap giờ học (thứ × giờ) ──────────────────────────────── */

export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** [7][24] số phiên học */
export const studyHeatmap: number[][] = (() => {
    const rnd = mulberry32(4242);
    return WEEKDAYS.map((_, d) =>
        Array.from({ length: 24 }, (_, h) => {
            const night = Math.exp(-((h - 21) ** 2) / 6) * 1.0;   // đỉnh 21h
            const noon = Math.exp(-((h - 12) ** 2) / 5) * 0.45;   // trưa
            const morning = Math.exp(-((h - 8) ** 2) / 4) * 0.35;
            const weekend = d >= 5 ? 0.75 : 1;
            const v = (night + noon + morning) * weekend * (0.8 + rnd() * 0.4);
            return Math.round(v * 120);
        }),
    );
})();

/* ── Hộp thư vận hành ─────────────────────────────────────────── */

export type ActionTone = 'critical' | 'warning' | 'info';
/** Trùng với AdminActionKind bên BE. */
export type ActionKind = 'unanswered-questions' | 'low-reviews' | 'no-lesson' | 'no-test' | 'no-image' | 'hidden';

export interface ActionItem {
    id: string;
    kind: ActionKind;
    tone: ActionTone;
    title: string;
    meta: string;
    courseId: number;
    lessonId?: number;
    /** Nhãn nút hành động chính */
    cta: string;
    /** Điều hướng khi bấm CTA (nếu có) */
    to?: string;
    /** Hành động tại chỗ: bật lại khóa / mở tab hỏi đáp / mở tab review */
    inline?: 'enable' | 'reply-questions' | 'reply-reviews';
}

export const actionItems: ActionItem[] = [
    { id: 'unanswered-2', kind: 'unanswered-questions', tone: 'critical', title: '3 câu hỏi chưa được trả lời',    meta: 'JavaScript Fundamentals · lâu nhất 2 ngày trước',   courseId: 2,  cta: 'Trả lời',      inline: 'reply-questions' },
    { id: 'no-test-5',    kind: 'no-test',              tone: 'warning',  title: 'Chưa có bài kiểm tra cuối khóa', meta: 'Advanced React Patterns · khóa có phí',             courseId: 5,  cta: 'Tạo bài test', to: '/management/courses/5/lessons' },
    { id: 'no-lesson-21', kind: 'no-lesson',            tone: 'warning',  title: 'Khóa học chưa có bài học nào',   meta: 'Rust cho người mới · tạo 5 ngày trước',            courseId: 21, cta: 'Thêm bài học', to: '/management/courses/21/lessons' },
    { id: 'low-reviews-7', kind: 'low-reviews',         tone: 'warning',  title: '1 review thấp chưa được phản hồi', meta: 'Node.js & REST API thực chiến · lâu nhất 1 ngày trước', courseId: 7, cta: 'Phản hồi', inline: 'reply-reviews' },
    { id: 'no-image-7',   kind: 'no-image',             tone: 'info',     title: 'Khóa có phí chưa có ảnh bìa',    meta: 'Node.js & REST API thực chiến',                    courseId: 7,  cta: 'Thêm ảnh',     to: '/management' },
    { id: 'hidden-13',    kind: 'hidden',               tone: 'warning',  title: 'Khóa học bị ẩn 12 ngày trước',   meta: 'Docker & Kubernetes cơ bản · 38 học viên đang học', courseId: 13, cta: 'Bật lại',      inline: 'enable' },
];

export interface OpenQuestion {
    id: number;
    user: string;
    course: string;
    courseId: number;
    lessonId: number;
    lesson: string;
    text: string;
    askedAt: string;
    /** BE chưa có vote cho câu hỏi — chỉ mock hiển thị */
    votes?: number;
}

export const openQuestions: OpenQuestion[] = [
    { id: 101, user: 'Đỗ Thanh Tùng',  course: 'JavaScript Fundamentals', courseId: 2, lessonId: 27, lesson: 'Bài 7 · Closure',            text: 'Closure giữ tham chiếu tới biến hay giá trị tại thời điểm tạo ạ? Em test thấy kết quả khác nhau khi dùng var và let.', askedAt: '2026-09-13T09:40:00', votes: 6 },
    { id: 102, user: 'Lê Hồng Nhung',  course: 'Introduction to React',   courseId: 1, lessonId: 9,  lesson: 'Bài 9 · useEffect',          text: 'Tại sao useEffect của em chạy 2 lần ở dev mode? Có phải bug không?',                                                askedAt: '2026-09-14T16:05:00', votes: 4 },
    { id: 103, user: 'Phan Anh Khoa',  course: 'TypeScript chuyên sâu',   courseId: 6, lessonId: 61, lesson: 'Bài 11 · Conditional types', text: 'Em không hiểu `infer` dùng trong trường hợp nào, thầy cho ví dụ thực tế được không?',                                askedAt: '2026-09-14T21:12:00', votes: 3 },
    { id: 104, user: 'Ngô Bảo Trân',   course: 'Node.js & REST API',      courseId: 7, lessonId: 74, lesson: 'Bài 14 · JWT',              text: 'Refresh token nên lưu cookie httpOnly hay localStorage? Bài giảng nói cả hai đều được.',                              askedAt: '2026-09-15T07:55:00', votes: 2 },
];

export interface LowReview {
    id: number;
    user: string;
    course: string;
    courseId: number;
    rating: number;
    text: string;
    at: string;
}

export const lowReviews: LowReview[] = [
    { id: 201, user: 'Trịnh Văn Long', course: 'Node.js & REST API thực chiến', courseId: 7, rating: 1, text: 'Video bài 14 bị lỗi tiếng từ phút 12, không nghe được gì.', at: '2026-09-14T20:30:00' },
    { id: 202, user: 'Mai Thị Hòa',    course: 'Advanced React Patterns',       courseId: 5, rating: 2, text: 'Bài tập khó hơn bài giảng nhiều, cần thêm ví dụ trung gian.', at: '2026-09-13T11:20:00' },
    { id: 203, user: 'Bùi Đức Mạnh',   course: 'TypeScript chuyên sâu',         courseId: 6, rating: 2, text: 'Chương 4 nói quá nhanh, mong có bản slide đi kèm.',           at: '2026-09-12T15:45:00' },
];

/* ── Top khóa / cấp độ / chứng chỉ / bài viết ─────────────────── */

export interface TopCourse {
    id: number;
    title: string;
    enrollments: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    revenue: number;
}

export const topCourses: TopCourse[] = [
    { id: 1, title: 'Introduction to React',         enrollments: 412, level: 'Beginner',     revenue: 0 },
    { id: 2, title: 'JavaScript Fundamentals',       enrollments: 356, level: 'Beginner',     revenue: 0 },
    { id: 5, title: 'Advanced React Patterns',       enrollments: 241, level: 'Intermediate', revenue: 120_259_000 },
    { id: 6, title: 'TypeScript chuyên sâu',         enrollments: 198, level: 'Intermediate', revenue: 79_002_000 },
    { id: 7, title: 'Node.js & REST API thực chiến', enrollments: 163, level: 'Advanced',     revenue: 97_637_000 },
];

export interface LevelSlice {
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    label: string;
    count: number;
}

export const levelDistribution: LevelSlice[] = [
    { level: 'Beginner',     label: 'Cơ bản',    count: 58 },
    { level: 'Intermediate', label: 'Trung cấp', count: 44 },
    { level: 'Advanced',     label: 'Nâng cao',  count: 26 },
];

export interface RecentCertificate {
    id: number;
    userName: string;
    userEmail: string;
    courseTitle: string;
    scorePercentage: number;
    issuedAt: string;
}

export const recentCertificates: RecentCertificate[] = [
    { id: 3218, userName: 'Nguyễn Minh An',  userEmail: 'an.nguyen@gmail.com',    courseTitle: 'Introduction to React',      scorePercentage: 96,  issuedAt: '2026-09-15T08:42:00' },
    { id: 3217, userName: 'Trần Bảo Châu',   userEmail: 'chau.tran@gmail.com',    courseTitle: 'TypeScript chuyên sâu',      scorePercentage: 88,  issuedAt: '2026-09-15T07:10:00' },
    { id: 3216, userName: 'Lê Quốc Dũng',    userEmail: 'dung.le@outlook.com',    courseTitle: 'JavaScript Fundamentals',    scorePercentage: 92,  issuedAt: '2026-09-14T22:31:00' },
    { id: 3215, userName: 'Phạm Thu Hà',     userEmail: 'ha.pham@gmail.com',      courseTitle: 'Advanced React Patterns',    scorePercentage: 81,  issuedAt: '2026-09-14T19:05:00' },
    { id: 3214, userName: 'Hoàng Gia Khánh', userEmail: 'khanh.hoang@fpt.edu.vn', courseTitle: 'Git & GitHub cho người mới', scorePercentage: 100, issuedAt: '2026-09-14T15:48:00' },
];

export interface TopArticle {
    id: number;
    title: string;
    views: number;
    /** BE chỉ có counter cộng dồn — chưa so được theo kỳ */
    deltaPct?: number;
}

export const topArticles: TopArticle[] = [
    { id: 1, title: 'React 19: những gì thay đổi với hooks',          views: 8420, deltaPct: 32 },
    { id: 2, title: 'Lộ trình Frontend 2026 cho người mới',           views: 6115, deltaPct: 18 },
    { id: 3, title: 'TypeScript utility types bạn nên biết',          views: 4380, deltaPct: -4 },
    { id: 4, title: 'Docker cho developer: 30 phút bắt đầu',          views: 3902, deltaPct: 11 },
    { id: 5, title: 'Viết REST API "đúng chuẩn" với Node.js',         views: 3277, deltaPct: 7 },
];

/* ── Live feed ────────────────────────────────────────────────── */

export type ActivityKind = 'enroll' | 'cert_issued' | 'review' | 'question' | 'course_updated' | 'course_created' | 'purchase';

export interface Activity {
    /** BE trả "{kind}:{id}", live mock dùng số */
    id: string | number;
    kind: ActivityKind;
    text: string;
    by: string;
    at: string;
}

export const recentActivity: Activity[] = [
    { id: 1, kind: 'purchase',       text: 'mua Advanced React Patterns · 499.000 ₫',              by: 'Vũ Hải Đăng',    at: '2026-09-15T09:12:00' },
    { id: 2, kind: 'cert_issued',    text: 'nhận chứng chỉ Introduction to React với 96 điểm',      by: 'Nguyễn Minh An', at: '2026-09-15T08:42:00' },
    { id: 3, kind: 'review',         text: 'đánh giá 5★ cho TypeScript chuyên sâu',                by: 'Trần Bảo Châu',  at: '2026-09-15T07:20:00' },
    { id: 4, kind: 'question',       text: 'đặt câu hỏi ở bài 14 · Node.js & REST API',             by: 'Ngô Bảo Trân',   at: '2026-09-15T07:55:00' },
    { id: 5, kind: 'enroll',         text: 'ghi danh JavaScript Fundamentals',                     by: 'Lý Gia Bảo',     at: '2026-09-15T06:30:00' },
    { id: 6, kind: 'course_updated', text: 'cập nhật chương 3 của Advanced React Patterns',        by: 'Admin',          at: '2026-09-14T17:40:00' },
];

const LIVE_NAMES = ['Trần Quang Huy', 'Nguyễn Thảo Vy', 'Phạm Đình Phúc', 'Lê Ngọc Ánh', 'Hoàng Minh Quân', 'Đặng Thu Trang', 'Vũ Tuấn Kiệt', 'Bùi Khánh Linh'];
const LIVE_COURSES = ['Introduction to React', 'JavaScript Fundamentals', 'TypeScript chuyên sâu', 'Advanced React Patterns', 'Git & GitHub cho người mới', 'HTML & CSS Responsive'];

/** Sinh 1 sự kiện ngẫu nhiên cho live feed (mock realtime). */
export const randomLiveEvent = (id: number): Activity => {
    const name = LIVE_NAMES[Math.floor(Math.random() * LIVE_NAMES.length)];
    const course = LIVE_COURSES[Math.floor(Math.random() * LIVE_COURSES.length)];
    const r = Math.random();
    const at = new Date().toISOString();
    if (r < 0.55) return { id, kind: 'enroll',      text: `ghi danh ${course}`,                          by: name, at };
    if (r < 0.75) return { id, kind: 'cert_issued', text: `nhận chứng chỉ ${course} với ${80 + Math.floor(Math.random() * 20)} điểm`, by: name, at };
    if (r < 0.88) return { id, kind: 'review',      text: `đánh giá ${4 + Math.round(Math.random())}★ cho ${course}`, by: name, at };
    if (r < 0.95) return { id, kind: 'purchase',    text: `mua ${course} · 499.000 ₫`,                   by: name, at };
    return           { id, kind: 'question',    text: `đặt câu hỏi ở ${course}`,                     by: name, at };
};
