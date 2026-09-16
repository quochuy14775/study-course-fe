import { useCallback, useEffect, useRef, useState } from 'react';
import adminDashboardService from '../../../services/adminDashboardService';
import type { Range } from '../../../mockDatas/mockAdminDashboard';
import { fromApi, fromMock, type DashboardData } from './data';

interface State {
    data: DashboardData | null;
    /** Đang tải lần đầu (chưa có gì để hiện) */
    loading: boolean;
    /** Đang tải lại (đổi range) — giữ render cũ, mờ đi */
    refreshing: boolean;
    error: string | null;
}

/**
 * Gọi 3 endpoint admin song song và gom thành view-model.
 * Ở development, nếu BE không phản hồi thì rơi về dữ liệu mẫu để vẫn xem được giao diện;
 * production hiện lỗi + nút thử lại.
 */
export function useDashboardData(range: Range) {
    const [state, setState] = useState<State>({ data: null, loading: true, refreshing: false, error: null });
    const [nonce, setNonce] = useState(0);
    const hasData = useRef(false);

    useEffect(() => {
        let cancelled = false;
        setState((s) => ({ ...s, loading: !hasData.current, refreshing: hasData.current, error: null }));

        (async () => {
            try {
                const [dashboard, inbox, activity] = await Promise.all([
                    adminDashboardService.getDashboard(range),
                    adminDashboardService.getInbox(),
                    adminDashboardService.getActivity(null, 20),
                ]);
                if (cancelled) return;
                hasData.current = true;
                setState({ data: fromApi(dashboard, inbox, activity), loading: false, refreshing: false, error: null });
            } catch (err) {
                if (cancelled) return;
                console.error('[AdminDashboard] fetch failed', err);
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[AdminDashboard] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).');
                    hasData.current = true;
                    setState({ data: fromMock(range), loading: false, refreshing: false, error: null });
                } else {
                    setState((s) => ({ ...s, loading: false, refreshing: false, error: 'Không tải được số liệu. Vui lòng thử lại.' }));
                }
            }
        })();

        return () => { cancelled = true; };
    }, [range, nonce]);

    const refresh = useCallback(() => setNonce((n) => n + 1), []);

    return { ...state, refresh };
}
