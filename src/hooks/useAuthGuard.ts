import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Trả về:
 *  - `guardOpen`  : boolean — có hiện AuthGuardModal không
 *  - `guardAction`: string  — mô tả hành động (hiển thị trong modal)
 *  - `closeGuard` : đóng modal
 *  - `requireAuth`: (callback, action?) => void
 *      Nếu user đã login → chạy callback ngay.
 *      Nếu chưa login   → mở modal.
 */
export const useAuthGuard = () => {
    const user = useAuthStore((s) => s.user);
    const [guardOpen, setGuardOpen]     = useState(false);
    const [guardAction, setGuardAction] = useState('thực hiện hành động này');

    const requireAuth = useCallback(
        (callback: () => void, action = 'thực hiện hành động này') => {
            const isExpired = user ? user.exp * 1000 < Date.now() : true;
            if (user && !isExpired) {
                callback();
            } else {
                setGuardAction(action);
                setGuardOpen(true);
            }
        },
        [user],
    );

    const closeGuard = useCallback(() => setGuardOpen(false), []);

    return { guardOpen, guardAction, closeGuard, requireAuth };
};
