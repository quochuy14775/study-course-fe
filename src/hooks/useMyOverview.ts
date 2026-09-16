import { useCallback, useEffect, useState } from 'react';
import userService from '../services/userService';
import { useAuthStore } from '../stores/authStore';
import type { UserOverview } from '../types/userOverview';

interface State {
    data: UserOverview | null;
    loading: boolean;
    error: string | null;
    source: 'api' | 'mock' | null;
}

/**
 * Dữ liệu trang cá nhân. Dev không có BE → dữ liệu mẫu (có nhãn) để vẫn xem được layout.
 */
export function useMyOverview() {
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

        userService.getMyOverview()
            .then((data) => { if (!cancelled) setState({ data, loading: false, error: null, source: 'api' }); })
            .catch((err) => {
                if (cancelled) return;
                console.error('[useMyOverview]', err);
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[useMyOverview] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).');
                    setState({ data: mockOverview(user.name, user.email), loading: false, error: null, source: 'mock' });
                } else {
                    setState({ data: null, loading: false, error: 'Không tải được trang cá nhân. Vui lòng thử lại.', source: null });
                }
            });

        return () => { cancelled = true; };
    }, [user, nonce]);

    const refresh = useCallback(() => setNonce((n) => n + 1), []);
    return { ...state, refresh };
}

/* ── Mock cho dev ─────────────────────────────────────────────── */

const daysAgo = (n: number, h = 9) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
};

const mockOverview = (name: string, email: string): UserOverview => ({
    profile: { email, userName: email.split('@')[0], fullName: name, avatarUrl: null, role: 'User' },
    joinedAt: daysAgo(210),
    stats: {
        enrolledCourses: 6, completedCourses: 2, completionRate: 33.3,
        lessonsCompleted: 74, studySeconds: 74 * 11 * 60,
        quizAttempts: 31, quizPassed: 26, quizPassRate: 83.9, bestScore: 100,
        certificates: 2, activeDays: 58,
    },
    points: 74 * 10 + 26 * 20 + 5 * 5 + 2 * 100 + 58 * 5,
    rank: { id: 'silver', label: 'Bạc', minPoints: 500, nextLabel: 'Vàng', nextMinPoints: 2000 },
    currentStreak: 6, longestStreak: 14, streakSafeToday: false,
    skills: [
        { kind: 'language',  id: 1, name: 'JavaScript', slug: 'javascript', completedLessons: 30, totalLessons: 36, progress: 83.3 },
        { kind: 'framework', id: 1, name: 'React',      slug: 'react',      completedLessons: 26, totalLessons: 36, progress: 72.2 },
        { kind: 'language',  id: 2, name: 'TypeScript', slug: 'typescript', completedLessons: 9,  totalLessons: 20, progress: 45 },
        { kind: 'framework', id: 2, name: 'Node.js',    slug: 'nodejs',     completedLessons: 6,  totalLessons: 30, progress: 20 },
        { kind: 'language',  id: 3, name: 'SQL',        slug: 'sql',        completedLessons: 3,  totalLessons: 14, progress: 21.4 },
    ],
    certificates: [
        { id: 3101, courseId: 1, courseTitle: 'Introduction to React',   userName: name, issuedAt: daysAgo(12), certificateCode: 'EDU-1-2026-K7Q2ZP', scorePercentage: 96 },
        { id: 2988, courseId: 2, courseTitle: 'JavaScript Fundamentals', userName: name, issuedAt: daysAgo(41), certificateCode: 'EDU-2-2026-M3XA8D', scorePercentage: 88 },
    ],
    continueLearning: [
        { courseId: 5, title: 'Advanced React Patterns',       level: 'Intermediate', progress: 54.2, lessonCount: 24, completedLessons: 13, nextLessonId: 514, nextLessonTitle: 'Compound components', lastActivityAt: daysAgo(1, 21) },
        { courseId: 6, title: 'TypeScript chuyên sâu',         level: 'Intermediate', progress: 45,   lessonCount: 20, completedLessons: 9,  nextLessonId: 610, nextLessonTitle: 'Generics nâng cao',   lastActivityAt: daysAgo(3, 20) },
        { courseId: 7, title: 'Node.js & REST API thực chiến', level: 'Advanced',     progress: 20,   lessonCount: 30, completedLessons: 6,  nextLessonId: 707, nextLessonTitle: 'Middleware & error handling', lastActivityAt: daysAgo(9, 22) },
    ],
    recent: [
        { kind: 'lesson', title: 'Render props & HOC',             courseId: 5, courseTitle: 'Advanced React Patterns', lessonId: 513, at: daysAgo(1, 21) },
        { kind: 'quiz',   title: 'Quiz: Hooks nâng cao',            courseId: 5, courseTitle: 'Advanced React Patterns', value: 90, passed: true, at: daysAgo(1, 21) },
        { kind: 'lesson', title: 'Custom hooks',                    courseId: 5, courseTitle: 'Advanced React Patterns', lessonId: 512, at: daysAgo(2, 20) },
        { kind: 'quiz',   title: 'Quiz: Conditional types',         courseId: 6, courseTitle: 'TypeScript chuyên sâu',   value: 60, passed: false, at: daysAgo(3, 20) },
        { kind: 'cert',   title: 'Introduction to React',           courseId: 1, courseTitle: 'Introduction to React',   value: 96, at: daysAgo(12) },
        { kind: 'enroll', title: 'Node.js & REST API thực chiến',   courseId: 7, courseTitle: 'Node.js & REST API thực chiến', at: daysAgo(15) },
    ],
    achievements: [
        { id: 'first-lesson',  label: 'Bước đầu tiên',  description: 'Hoàn thành bài học đầu tiên',    earned: true,  progress: 1,  target: 1 },
        { id: 'lessons-25',    label: 'Chăm chỉ',       description: 'Hoàn thành 25 bài học',           earned: true,  progress: 25, target: 25 },
        { id: 'lessons-100',   label: 'Cày cuốc',       description: 'Hoàn thành 100 bài học',          earned: false, progress: 74, target: 100 },
        { id: 'streak-7',      label: 'Tuần rực lửa',   description: 'Học 7 ngày liên tiếp',            earned: true,  progress: 7,  target: 7 },
        { id: 'streak-30',     label: 'Kỷ luật thép',   description: 'Học 30 ngày liên tiếp',           earned: false, progress: 14, target: 30 },
        { id: 'quiz-10',       label: 'Thợ giải đề',    description: 'Đạt 10 bài quiz',                 earned: true,  progress: 10, target: 10 },
        { id: 'perfect-score', label: 'Điểm tuyệt đối', description: 'Đạt 100% trong một bài kiểm tra', earned: true,  progress: 1,  target: 1 },
        { id: 'first-cert',    label: 'Có bằng rồi',    description: 'Nhận chứng chỉ đầu tiên',         earned: true,  progress: 1,  target: 1 },
        { id: 'certs-5',       label: 'Bộ sưu tập',     description: 'Nhận 5 chứng chỉ',                earned: false, progress: 2,  target: 5 },
        { id: 'active-100',    label: 'Người bền bỉ',   description: 'Có 100 ngày học trong năm',       earned: false, progress: 58, target: 100 },
    ],
});
