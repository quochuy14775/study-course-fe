import { useCallback, useEffect, useState } from 'react';

export interface Chapter {
    id: string;
    title: string;
    lessonIds: number[];
    collapsed?: boolean;
}

interface ChaptersData {
    chapters: Chapter[];
}

export interface LessonRef {
    id: number;
    chapterId?: number | null;
}

const STORAGE_KEY = (courseId: number | string) => `eduhub:course:${courseId}:chapters`;

const UNCATEGORIZED_ID = 'uncategorized';

function chaptersEqual(a: Chapter[], b: Chapter[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id || a[i].lessonIds.length !== b[i].lessonIds.length) return false;
        for (let j = 0; j < a[i].lessonIds.length; j++) {
            if (a[i].lessonIds[j] !== b[i].lessonIds[j]) return false;
        }
    }
    return true;
}

const createDefaultData = (): ChaptersData => ({
    chapters: [
        { id: UNCATEGORIZED_ID, title: 'Chưa phân loại', lessonIds: [] },
    ],
});

export function useChapters(courseId: number | string | undefined, allLessons: LessonRef[]) {
    const [data, setData] = useState<ChaptersData>(createDefaultData);

    useEffect(() => {
        if (!courseId) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY(courseId));
            if (raw) {
                const parsed: ChaptersData = JSON.parse(raw);
                if (parsed?.chapters?.length) {
                    setData(parsed);
                    return;
                }
            }
        } catch {}
        setData(createDefaultData());
    }, [courseId]);

    useEffect(() => {
        if (!courseId) return;
        try {
            localStorage.setItem(STORAGE_KEY(courseId), JSON.stringify(data));
        } catch {}
    }, [data, courseId]);

    // Reconcile: ensure every lesson lives in exactly one chapter.
    // Missing lessons are grouped by their BE chapterId — each unique BE chapter
    // gets its own FE chapter (id = "ch_be_{beChapterId}"). Lessons with no
    // chapterId fall back to uncategorized.
    useEffect(() => {
        setData((prev) => {
            const allIds = allLessons.map((l) => l.id);
            const seen = new Set<number>();

            const cleaned = prev.chapters.map((c) => ({
                ...c,
                lessonIds: c.lessonIds.filter((id) => {
                    if (!allIds.includes(id) || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                }),
            }));

            const missing = allLessons.filter((l) => !seen.has(l.id));

            if (missing.length === 0 && chaptersEqual(cleaned, prev.chapters)) {
                return prev;
            }

            let chapters = cleaned;
            if (!chapters.find((c) => c.id === UNCATEGORIZED_ID)) {
                chapters = [{ id: UNCATEGORIZED_ID, title: 'Chưa phân loại', lessonIds: [] }, ...chapters];
            }

            if (missing.length > 0) {
                // Group by BE chapterId
                const grouped: Record<string, number[]> = {};
                for (const l of missing) {
                    const key = l.chapterId ? `ch_be_${l.chapterId}` : UNCATEGORIZED_ID;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(l.id);
                }

                for (const feKey of Object.keys(grouped)) {
                    const ids = grouped[feKey];
                    const existing = chapters.find((c) => c.id === feKey);
                    if (existing) {
                        chapters = chapters.map((c) =>
                            c.id === feKey ? { ...c, lessonIds: [...c.lessonIds, ...ids] } : c,
                        );
                    } else {
                        const n = chapters.filter((c) => c.id !== UNCATEGORIZED_ID).length + 1;
                        chapters = [...chapters, { id: feKey, title: `Chương ${n}`, lessonIds: ids }];
                    }
                }
            }

            return { chapters };
        });
    }, [allLessons]);

    const addChapter = useCallback((title: string, customId?: string) => {
        const id = customId ?? `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        setData((prev) => ({ chapters: [...prev.chapters, { id, title, lessonIds: [] }] }));
        return id;
    }, []);

    const renameChapter = useCallback((id: string, title: string) => {
        setData((prev) => ({
            chapters: prev.chapters.map((c) => (c.id === id ? { ...c, title } : c)),
        }));
    }, []);

    const deleteChapter = useCallback((id: string) => {
        if (id === UNCATEGORIZED_ID) return;
        setData((prev) => {
            const target = prev.chapters.find((c) => c.id === id);
            if (!target) return prev;
            const remaining = prev.chapters.filter((c) => c.id !== id);
            return {
                chapters: remaining.map((c) =>
                    c.id === UNCATEGORIZED_ID
                        ? { ...c, lessonIds: [...c.lessonIds, ...target.lessonIds] }
                        : c,
                ),
            };
        });
    }, []);

    const toggleCollapse = useCallback((id: string) => {
        setData((prev) => ({
            chapters: prev.chapters.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed } : c)),
        }));
    }, []);

    const reorderChapters = useCallback((oldIndex: number, newIndex: number) => {
        setData((prev) => {
            const next = [...prev.chapters];
            const [removed] = next.splice(oldIndex, 1);
            next.splice(newIndex, 0, removed);
            return { chapters: next };
        });
    }, []);

    const reorderLessonsInChapter = useCallback((chapterId: string, oldIndex: number, newIndex: number) => {
        setData((prev) => ({
            chapters: prev.chapters.map((c) => {
                if (c.id !== chapterId) return c;
                const next = [...c.lessonIds];
                const [removed] = next.splice(oldIndex, 1);
                next.splice(newIndex, 0, removed);
                return { ...c, lessonIds: next };
            }),
        }));
    }, []);

    const moveLessonToChapter = useCallback((lessonId: number, targetChapterId: string) => {
        setData((prev) => ({
            chapters: prev.chapters.map((c) => {
                if (c.id === targetChapterId) {
                    return c.lessonIds.includes(lessonId) ? c : { ...c, lessonIds: [...c.lessonIds, lessonId] };
                }
                return { ...c, lessonIds: c.lessonIds.filter((id) => id !== lessonId) };
            }),
        }));
    }, []);

    const moveLessonToChapterAtIndex = useCallback((lessonId: number, targetChapterId: string, targetIndex: number) => {
        setData((prev) => ({
            chapters: prev.chapters.map((c) => {
                if (c.id === targetChapterId) {
                    const filtered = c.lessonIds.filter((id) => id !== lessonId);
                    filtered.splice(targetIndex, 0, lessonId);
                    return { ...c, lessonIds: filtered };
                }
                return { ...c, lessonIds: c.lessonIds.filter((id) => id !== lessonId) };
            }),
        }));
    }, []);

    return {
        chapters: data.chapters,
        addChapter,
        renameChapter,
        deleteChapter,
        toggleCollapse,
        reorderChapters,
        reorderLessonsInChapter,
        moveLessonToChapter,
        moveLessonToChapterAtIndex,
        UNCATEGORIZED_ID,
    };
}
