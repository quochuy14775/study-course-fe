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

const STORAGE_KEY = (courseId: number | string) => `eduhub:course:${courseId}:chapters`;

const UNCATEGORIZED_ID = 'uncategorized';

const createDefaultData = (): ChaptersData => ({
    chapters: [
        { id: UNCATEGORIZED_ID, title: 'Chưa phân loại', lessonIds: [] },
    ],
});

export function useChapters(courseId: number | string | undefined, allLessonIds: number[]) {
    const [data, setData] = useState<ChaptersData>(createDefaultData);

    // Load from localStorage on mount / courseId change
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

    // Persist on change
    useEffect(() => {
        if (!courseId) return;
        try {
            localStorage.setItem(STORAGE_KEY(courseId), JSON.stringify(data));
        } catch {}
    }, [data, courseId]);

    // Reconcile: ensure every lesson lives in exactly one chapter (default: uncategorized)
    useEffect(() => {
        setData((prev) => {
            const seen = new Set<number>();
            const cleaned = prev.chapters.map((c) => ({
                ...c,
                lessonIds: c.lessonIds.filter((id) => {
                    if (!allLessonIds.includes(id) || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                }),
            }));
            const missing = allLessonIds.filter((id) => !seen.has(id));
            if (missing.length === 0 && JSON.stringify(cleaned) === JSON.stringify(prev.chapters)) {
                return prev;
            }
            // Ensure uncategorized exists
            let chapters = cleaned;
            if (!chapters.find((c) => c.id === UNCATEGORIZED_ID)) {
                chapters = [{ id: UNCATEGORIZED_ID, title: 'Chưa phân loại', lessonIds: [] }, ...chapters];
            }
            if (missing.length) {
                chapters = chapters.map((c) =>
                    c.id === UNCATEGORIZED_ID ? { ...c, lessonIds: [...c.lessonIds, ...missing] } : c,
                );
            }
            return { chapters };
        });
    }, [allLessonIds]);

    const addChapter = useCallback((title: string) => {
        const id = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
            // Move its lessons to uncategorized
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

    return {
        chapters: data.chapters,
        addChapter,
        renameChapter,
        deleteChapter,
        toggleCollapse,
        reorderChapters,
        reorderLessonsInChapter,
        moveLessonToChapter,
        UNCATEGORIZED_ID,
    };
}
