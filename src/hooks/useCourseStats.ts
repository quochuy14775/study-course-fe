import { useEffect, useState } from 'react';
import lessonService from '../services/lessonService';

export interface CourseStats {
    chapterCount: number;
    lessonCount: number;
    totalDurationSec: number;
    loading: boolean;
}

interface CachedChapters {
    chapters: Array<{ id: string; lessonIds: number[] }>;
}

const STORAGE_KEY = (courseId: number | string) => `eduhub:course:${courseId}:chapters`;
const UNCATEGORIZED_ID = 'uncategorized';

// Simple in-memory cache to avoid refetching when scrolling through course list
const cache = new Map<string, { lessonCount: number; totalDurationSec: number; fetchedAt: number }>();
const CACHE_TTL = 30_000; // 30s

const readChapterCount = (courseId: number | string): number => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY(courseId));
        if (!raw) return 0;
        const parsed: CachedChapters = JSON.parse(raw);
        // Count chapters that are NOT the empty "uncategorized" virtual chapter
        return parsed.chapters.filter(
            (c) => c.id !== UNCATEGORIZED_ID || c.lessonIds.length > 0,
        ).length;
    } catch {
        return 0;
    }
};

export function useCourseStats(courseId: number | string | undefined): CourseStats {
    const [stats, setStats] = useState<CourseStats>({
        chapterCount: 0,
        lessonCount: 0,
        totalDurationSec: 0,
        loading: true,
    });

    useEffect(() => {
        if (!courseId) return;
        let mounted = true;

        const key = String(courseId);
        const cached = cache.get(key);
        const chapterCount = readChapterCount(courseId);

        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
            setStats({
                chapterCount,
                lessonCount: cached.lessonCount,
                totalDurationSec: cached.totalDurationSec,
                loading: false,
            });
            return;
        }

        setStats((s) => ({ ...s, chapterCount, loading: true }));

        (async () => {
            try {
                const data = await lessonService.getLessons(Number(courseId));
                if (!mounted) return;
                const list = data?.value ?? [];
                const lessonCount = list.length;
                const totalDurationSec = list.reduce<number>(
                    (sum, l) => sum + (Number(l.duration) || 0),
                    0,
                );
                cache.set(key, { lessonCount, totalDurationSec, fetchedAt: Date.now() });
                setStats({ chapterCount, lessonCount, totalDurationSec, loading: false });
            } catch {
                if (!mounted) return;
                setStats({ chapterCount, lessonCount: 0, totalDurationSec: 0, loading: false });
            }
        })();

        return () => { mounted = false; };
    }, [courseId]);

    return stats;
}

export const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};
