import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

interface SavedIds { courses: number[]; articles: number[] }

interface SavedState {
    /** Key theo email để hai tài khoản trên cùng máy không thấy danh sách của nhau. */
    byUser: Record<string, SavedIds>;
    toggleCourse: (user: string, id: number) => void;
    toggleArticle: (user: string, id: number) => void;
}

const EMPTY: SavedIds = { courses: [], articles: [] };
const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/**
 * Khóa học / bài viết đã lưu. BE chưa có endpoint nên giữ ở localStorage —
 * chỉ tồn tại trên trình duyệt này; khi có API thì thay phần persist bằng gọi service.
 */
export const useSavedStore = create<SavedState>()(
    persist(
        (set) => ({
            byUser: {},
            toggleCourse: (user, id) => set((s) => {
                const cur = s.byUser[user] ?? EMPTY;
                return { byUser: { ...s.byUser, [user]: { ...cur, courses: toggle(cur.courses, id) } } };
            }),
            toggleArticle: (user, id) => set((s) => {
                const cur = s.byUser[user] ?? EMPTY;
                return { byUser: { ...s.byUser, [user]: { ...cur, articles: toggle(cur.articles, id) } } };
            }),
        }),
        { name: 'saved-items' },
    ),
);

/** Danh sách đã lưu của user đang đăng nhập (khách dùng key 'anon'). */
export function useSaved() {
    const user = useAuthStore((s) => s.user?.email ?? 'anon');
    const ids = useSavedStore((s) => s.byUser[user]) ?? EMPTY;
    const toggleCourse = useSavedStore((s) => s.toggleCourse);
    const toggleArticle = useSavedStore((s) => s.toggleArticle);
    return {
        courses: ids.courses,
        articles: ids.articles,
        isCourseSaved: (id: number) => ids.courses.includes(id),
        isArticleSaved: (id: number) => ids.articles.includes(id),
        toggleCourse: (id: number) => toggleCourse(user, id),
        toggleArticle: (id: number) => toggleArticle(user, id),
    };
}
