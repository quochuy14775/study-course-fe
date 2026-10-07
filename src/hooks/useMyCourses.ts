import { useEffect, useState } from 'react';
import enrollmentService from '../services/enrollmentService';
import { useAuthStore } from '../stores/authStore';
import type { EnrolledCourse } from '../types/enrollment';

/* Cache module-level như useMyActivity — nhiều component trên trang chủ cùng cần, chỉ gọi 1 lần. */
const TTL_MS = 60_000;
const EMPTY: EnrolledCourse[] = [];
let cached: { at: number; key: string; data: EnrolledCourse[] } | null = null;
let inflight: Promise<EnrolledCourse[]> | null = null;

/** Bỏ cache để lần render tới gọi lại API (sau khi hoàn thành bài / đạt bài test). */
export const invalidateMyCourses = () => { cached = null; };

/** Khóa đang học dở có tiến độ cao nhất — thứ người dùng nhiều khả năng muốn học tiếp. */
export const pickContinueLearning = (list: EnrolledCourse[]): EnrolledCourse | null =>
    list.filter((e) => !e.isCompleted && e.progress > 0)
        .sort((a, b) => b.progress - a.progress)[0] ?? null;

/**
 * Danh sách ghi danh của user đang đăng nhập kèm cờ loading. Trả về mảng rỗng khi
 * chưa đăng nhập (và không gọi API).
 */
export function useMyCoursesState(): { data: EnrolledCourse[]; loading: boolean } {
    const user = useAuthStore((s) => s.user);
    const key = user?.email ?? 'anon';
    const fresh = () => cached && cached.key === key && Date.now() - cached.at < TTL_MS ? cached.data : null;

    const [state, setState] = useState(() => {
        const hit = user ? fresh() : null;
        return { data: hit ?? EMPTY, loading: !!user && !hit };
    });

    useEffect(() => {
        if (!user) { setState({ data: EMPTY, loading: false }); return; }
        const hit = fresh();
        if (hit) { setState({ data: hit, loading: false }); return; }

        let cancelled = false;
        setState((s) => ({ ...s, loading: true }));
        inflight ??= enrollmentService.getMyCourses().finally(() => { inflight = null; });
        inflight
            .then((list) => {
                cached = { at: Date.now(), key, data: list };
                if (!cancelled) setState({ data: list, loading: false });
            })
            .catch((err) => {
                console.error('[useMyCourses]', err);
                if (!cancelled) setState({ data: EMPTY, loading: false });
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, key]);

    return state;
}

export function useMyCourses(): EnrolledCourse[] {
    return useMyCoursesState().data;
}
