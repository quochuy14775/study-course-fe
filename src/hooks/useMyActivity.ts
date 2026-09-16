import { useEffect, useState } from 'react';
import userService from '../services/userService';
import { useAuthStore } from '../stores/authStore';
import { generateContributionData } from '../mockDatas/mockBrowsingHistory';
import type { UserActivity, UserActivityDay } from '../types/userActivity';

export interface MyActivityState {
    data: UserActivity | null;
    loading: boolean;
    error: string | null;
    source: 'api' | 'mock' | null;
}

/* ── Cache dùng chung giữa PersonalPage / SettingsPage / HomePage — 1 request cho cả 3 ── */

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: UserActivity; source: 'api' | 'mock' }>();
const inflight = new Map<string, Promise<{ data: UserActivity; source: 'api' | 'mock' }>>();

const load = (key: string, days: number) => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit);

    const pending = inflight.get(key);
    if (pending) return pending;

    const p = userService.getMyActivity(days)
        .then((data) => ({ data, source: 'api' as const }))
        .catch((err) => {
            // Dev không có backend vẫn xem được profile với dữ liệu mẫu
            if (process.env.NODE_ENV !== 'development') throw err;
            console.warn('[useMyActivity] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).', err);
            return { data: mockActivity(days), source: 'mock' as const };
        })
        .then((res) => {
            cache.set(key, { at: Date.now(), ...res });
            return res;
        })
        .finally(() => inflight.delete(key));

    inflight.set(key, p);
    return p;
};

/** Bỏ cache để lần render tới gọi lại API (vd. sau khi hoàn thành bài học). */
export const invalidateMyActivity = () => cache.clear();

/**
 * Contribution + streak của user đang đăng nhập. Không gọi API khi chưa đăng nhập.
 */
export function useMyActivity(days = 365, enabled = true): MyActivityState {
    const user = useAuthStore((s) => s.user);
    const key = `${user?.email ?? 'anon'}:${days}`;
    const active = enabled && !!user;

    const [state, setState] = useState<MyActivityState>(() => {
        const hit = active ? cache.get(key) : undefined;
        return hit
            ? { data: hit.data, loading: false, error: null, source: hit.source }
            : { data: null, loading: active, error: null, source: null };
    });

    useEffect(() => {
        if (!active) {
            setState({ data: null, loading: false, error: null, source: null });
            return;
        }
        let cancelled = false;
        setState((s) => ({ ...s, loading: !s.data, error: null }));
        load(key, days)
            .then((res) => { if (!cancelled) setState({ data: res.data, loading: false, error: null, source: res.source }); })
            .catch((err) => {
                console.error('[useMyActivity]', err);
                if (!cancelled) setState({ data: null, loading: false, error: 'Không tải được hoạt động học tập.', source: null });
            });
        return () => { cancelled = true; };
    }, [key, days, active]);

    return state;
}

/* ── Mock: sinh từ generateContributionData() để dev không có BE vẫn thấy graph ── */

const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const mockActivity = (days: number): UserActivity => {
    const raw = generateContributionData().slice(-days);
    const list: UserActivityDay[] = raw.map((c) => ({
        date: toIso(c.date),
        count: c.count,
        lessons: Math.min(c.count, Math.ceil(c.count * 0.6)),
        quizzes: c.count > 2 ? 1 : 0,
        posts: Math.max(0, c.count - Math.ceil(c.count * 0.6) - (c.count > 2 ? 1 : 0)),
        enrollments: 0,
        certificates: 0,
    }));

    const activeSet = new Set(list.filter((d) => d.count > 0).map((d) => d.date));
    const today = list[list.length - 1]?.date ?? toIso(new Date());
    const safeToday = activeSet.has(today);

    let current = 0;
    for (let i = list.length - (safeToday ? 1 : 2); i >= 0 && list[i].count > 0; i--) current++;

    let longest = 0, run = 0;
    for (const d of list) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }

    return {
        today,
        days: list,
        currentStreak: current,
        longestStreak: longest,
        streakSafeToday: safeToday,
        activeDays: activeSet.size,
        totalActions: list.reduce((s, d) => s + d.count, 0),
        totalLessons: list.reduce((s, d) => s + d.lessons, 0),
        totalQuizzes: list.reduce((s, d) => s + d.quizzes, 0),
    };
};
