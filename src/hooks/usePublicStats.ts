import { useEffect, useState } from 'react';
import statsService, { type PublicStats } from '../services/statsService';

interface State {
    data: PublicStats | null;
    loading: boolean;
    source: 'api' | 'mock' | null;
}

/* Cache module-level: trang chủ mount lại nhiều lần khi điều hướng, không cần gọi lại. */
let cached: { at: number; data: PublicStats } | null = null;
let inflight: Promise<PublicStats> | null = null;
const TTL_MS = 5 * 60_000;

/** Số liệu marketing dùng khi dev không có BE — KHÔNG bao giờ hiện ở production. */
const DEV_FALLBACK: PublicStats = {
    learners: 12480, activeCourses: 112, lessons: 1860, enrollments: 18930,
    certificatesIssued: 3218, averageRating: 4.9, completionRate: 62.8, computedAt: new Date().toISOString(),
};

export function usePublicStats(): State {
    const [state, setState] = useState<State>(() =>
        cached && Date.now() - cached.at < TTL_MS
            ? { data: cached.data, loading: false, source: 'api' }
            : { data: null, loading: true, source: null },
    );

    useEffect(() => {
        if (state.data) return;
        let cancelled = false;

        inflight ??= statsService.getPublic().finally(() => { inflight = null; });
        inflight
            .then((data) => {
                cached = { at: Date.now(), data };
                if (!cancelled) setState({ data, loading: false, source: 'api' });
            })
            .catch((err) => {
                if (cancelled) return;
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[usePublicStats] Backend không phản hồi — đang dùng số liệu mẫu (chỉ ở development).', err);
                    setState({ data: DEV_FALLBACK, loading: false, source: 'mock' });
                } else {
                    // Production: ẩn khối số liệu thay vì hiện số giả
                    setState({ data: null, loading: false, source: null });
                }
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return state;
}
