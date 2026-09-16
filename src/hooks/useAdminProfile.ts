import { useCallback, useEffect, useState } from 'react';
import adminDashboardService from '../services/adminDashboardService';
import { useAuthStore } from '../stores/authStore';
import type { AdminProfile } from '../types/adminProfile';
import type { UserActivityDay } from '../types/userActivity';

interface State {
    data: AdminProfile | null;
    loading: boolean;
    error: string | null;
    source: 'api' | 'mock' | null;
}

/** Trang cá nhân admin. Dev không có BE → dữ liệu mẫu (có nhãn). */
export function useAdminProfile() {
    const user = useAuthStore((s) => s.user);
    const [state, setState] = useState<State>({ data: null, loading: !!user, error: null, source: null });
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        if (!user) {
            setState({ data: null, loading: false, error: null, source: null });
            return;
        }
        let cancelled = false;
        setState((s) => ({ ...s, loading: !s.data, error: null }));

        adminDashboardService.getMyProfile()
            .then((data) => { if (!cancelled) setState({ data, loading: false, error: null, source: 'api' }); })
            .catch((err) => {
                if (cancelled) return;
                console.error('[useAdminProfile]', err);
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[useAdminProfile] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).');
                    setState({ data: mockAdminProfile(user.name, user.email), loading: false, error: null, source: 'mock' });
                } else {
                    setState({ data: null, loading: false, error: 'Không tải được hồ sơ quản trị. Vui lòng thử lại.', source: null });
                }
            });

        return () => { cancelled = true; };
    }, [user, nonce]);

    const refresh = useCallback(() => setNonce((n) => n + 1), []);
    return { ...state, refresh };
}

/* ── Mock cho dev ─────────────────────────────────────────────── */

const daysAgo = (n: number, h = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
};

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Hoạt động quản trị mẫu: tập trung ngày làm việc, thưa cuối tuần. */
const mockAdminActivity = (days = 365) => {
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const list: UserActivityDay[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const r = rnd();
        const active = weekend ? r < 0.15 : r < 0.7;
        const posts = active ? Math.floor(rnd() * 4) : 0;
        const lessons = active && rnd() < 0.35 ? 1 : 0;
        const quizzes = active && rnd() < 0.12 ? 1 : 0;
        list.push({ date: toIso(d), count: posts + lessons + quizzes, lessons, quizzes, posts, enrollments: 0, certificates: 0 });
    }
    const activeSet = new Set(list.filter((d) => d.count > 0).map((d) => d.date));
    const todayIso = list[list.length - 1].date;
    const safe = activeSet.has(todayIso);
    let current = 0;
    for (let i = list.length - (safe ? 1 : 2); i >= 0 && list[i].count > 0; i--) current++;
    let longest = 0, run = 0;
    for (const d of list) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
    return {
        today: todayIso, days: list, currentStreak: current, longestStreak: longest, streakSafeToday: safe,
        activeDays: activeSet.size,
        totalActions: list.reduce((s, d) => s + d.count, 0),
        totalLessons: list.reduce((s, d) => s + d.lessons, 0),
        totalQuizzes: list.reduce((s, d) => s + d.quizzes, 0),
    };
};

const mockAdminProfile = (name: string, email: string): AdminProfile => ({
    profile: { email, userName: email.split('@')[0], fullName: name, avatarUrl: null, role: 'Admin' },
    joinedAt: daysAgo(420),
    contribution: { coursesCreated: 14, coursesUpdated: 22, lessonsInMyCourses: 236, learnersInMyCourses: 3184, articlesWritten: 9, answersGiven: 87, reviewRepliesGiven: 31 },
    system: { courses: 128, activeCourses: 112, learners: 12480, enrollments: 18930, certificatesIssued: 3218, pendingQuestions: 3, pendingLowReviews: 1, coursesWithoutTest: 4 },
    myCourses: [
        { id: 1, title: 'Introduction to React',         level: 'Beginner',     isActive: true,  price: 0,      lessonCount: 12, learners: 1240, rating: 4.8, createdAt: daysAgo(400), updatedAt: daysAgo(3) },
        { id: 5, title: 'Advanced React Patterns',       level: 'Intermediate', isActive: true,  price: 499000, lessonCount: 24, learners: 612,  rating: 4.9, createdAt: daysAgo(300), updatedAt: daysAgo(1) },
        { id: 6, title: 'TypeScript chuyên sâu',         level: 'Intermediate', isActive: true,  price: 399000, lessonCount: 20, learners: 498,  rating: 4.8, createdAt: daysAgo(210), updatedAt: daysAgo(12) },
        { id: 7, title: 'Node.js & REST API thực chiến', level: 'Advanced',     isActive: true,  price: 599000, lessonCount: 30, learners: 401,  rating: 4.9, createdAt: daysAgo(150), updatedAt: daysAgo(5) },
        { id: 21, title: 'Rust cho người mới',           level: 'Beginner',     isActive: true,  price: 0,      lessonCount: 0,  learners: 0,    rating: 0,   createdAt: daysAgo(5),   updatedAt: null },
        { id: 13, title: 'Docker & Kubernetes cơ bản',   level: 'Intermediate', isActive: false, price: 299000, lessonCount: 16, learners: 38,   rating: 4.4, createdAt: daysAgo(120), updatedAt: daysAgo(12) },
    ],
    recent: [
        { kind: 'course_updated', title: 'Advanced React Patterns',        courseId: 5,  at: daysAgo(1, 17) },
        { kind: 'answer',         title: 'Bài 7 · Closure',                courseId: 2,  lessonId: 27, at: daysAgo(1, 15) },
        { kind: 'reply',          title: 'Node.js & REST API thực chiến',  courseId: 7,  at: daysAgo(2, 9) },
        { kind: 'course_updated', title: 'Introduction to React',          courseId: 1,  at: daysAgo(3, 11) },
        { kind: 'article',        title: 'React 19: những gì thay đổi với hooks', articleId: 1, at: daysAgo(4, 14) },
        { kind: 'course_created', title: 'Rust cho người mới',             courseId: 21, at: daysAgo(5, 10) },
    ],
    activity: mockAdminActivity(),
});
