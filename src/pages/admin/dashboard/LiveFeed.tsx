import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, MessageCircleQuestionMark, Pencil, FilePlus, UserPlus, ShoppingBag, Pause, Play, type LucideIcon } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import adminDashboardService from '../../../services/adminDashboardService';
import { cn } from '../../../lib/cn';
import { DashCard, CardTitle, timeAgo } from './shared';
import { useDashboard, mapActivity } from './data';
import { randomLiveEvent, type Activity, type ActivityKind } from '../../../mockDatas/mockAdminDashboard';

const KIND: Record<ActivityKind, { icon: LucideIcon; label: string; cls: string }> = {
    enroll:         { icon: UserPlus,                  label: 'Ghi danh',  cls: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' },
    purchase:       { icon: ShoppingBag,               label: 'Mua Pro',   cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    cert_issued:    { icon: Award,                     label: 'Chứng chỉ', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
    review:         { icon: Star,                      label: 'Đánh giá',  cls: 'bg-surface-2 text-fg-muted' },
    question:       { icon: MessageCircleQuestionMark, label: 'Câu hỏi',   cls: 'bg-surface-2 text-fg-muted' },
    course_updated: { icon: Pencil,                    label: 'Cập nhật',  cls: 'bg-surface-2 text-fg-muted' },
    course_created: { icon: FilePlus,                  label: 'Tạo mới',   cls: 'bg-surface-2 text-fg-muted' },
};

const MAX_ITEMS = 8;
const POLL_MS = 30_000;

interface Props {
    /** Gọi khi có ghi danh/mua mới để KPI nhảy theo */
    onEnroll?: () => void;
}

/**
 * Hoạt động gần đây.
 * - API: poll /admin/activity mỗi 30s, item mới chèn lên đầu (thay bằng SignalR khi BE có).
 * - Mock: tự sinh sự kiện mỗi 6–11s để xem animation.
 */
const LiveFeed: React.FC<Props> = ({ onEnroll }) => {
    const data = useDashboard();
    const isApi = data.source === 'api';
    const [items, setItems] = useState<Activity[]>(data.activity);
    const [paused, setPaused] = useState(false);
    const [tick, setTick] = useState(0);
    const nextId = useRef(1000);

    // Dữ liệu tải lại → đồng bộ
    useEffect(() => { setItems(data.activity); }, [data.activity]);

    // Nguồn sự kiện mới
    useEffect(() => {
        if (paused) return;
        let timer: number;

        if (isApi) {
            const poll = async () => {
                try {
                    const res = await adminDashboardService.getActivity(null, MAX_ITEMS);
                    const fresh = res.items.map(mapActivity);
                    setItems((cur) => {
                        const known = new Set(cur.map((c) => c.id));
                        const added = fresh.filter((f) => !known.has(f.id));
                        if (added.length === 0) return cur;
                        if (added.some((a) => a.kind === 'enroll')) onEnroll?.();
                        return [...added, ...cur].slice(0, MAX_ITEMS);
                    });
                } catch { /* giữ danh sách cũ, thử lại lượt sau */ }
                timer = window.setTimeout(poll, POLL_MS);
            };
            timer = window.setTimeout(poll, POLL_MS);
        } else {
            const schedule = () => {
                timer = window.setTimeout(() => {
                    const ev = randomLiveEvent(nextId.current++);
                    setItems((l) => [ev, ...l].slice(0, MAX_ITEMS));
                    if (ev.kind === 'enroll' || ev.kind === 'purchase') onEnroll?.();
                    schedule();
                }, 6000 + Math.random() * 5000);
            };
            schedule();
        }

        return () => window.clearTimeout(timer);
    }, [paused, isApi, onEnroll]);

    // Cập nhật "x phút trước" mỗi 30s
    useEffect(() => {
        const t = window.setInterval(() => setTick((n) => n + 1), 30000);
        return () => window.clearInterval(t);
    }, []);

    return (
        <DashCard className="h-full">
            <CardTitle
                title={
                    <span className="inline-flex items-center gap-2">
                        Hoạt động
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                {!paused && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
                                <span className={cn('relative inline-flex h-2 w-2 rounded-full', paused ? 'bg-fg-subtle' : 'bg-emerald-500')} />
                            </span>
                            {paused ? 'Tạm dừng' : 'Live'}
                        </span>
                    </span>
                }
                description={isApi ? 'Cập nhật mỗi 30 giây' : 'Học viên và nội dung, mới nhất ở trên'}
                action={
                    <Tooltip content={paused ? 'Tiếp tục' : 'Tạm dừng'} side="left">
                        <button
                            onClick={() => setPaused((p) => !p)}
                            aria-label={paused ? 'Tiếp tục cập nhật' : 'Tạm dừng cập nhật'}
                            className="w-8 h-8 rounded-lg border border-line bg-surface-2/60 text-fg-muted hover:text-fg flex items-center justify-center transition-colors"
                        >
                            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                    </Tooltip>
                }
            />
            <div className="px-5 pb-5 pt-3 flex-1 overflow-hidden" data-tick={tick}>
                {items.length === 0 ? (
                    <p className="py-10 text-center text-sm text-fg-subtle">Chưa có hoạt động nào.</p>
                ) : (
                    <ol className="relative">
                        <AnimatePresence initial={false}>
                            {items.map((a, i) => {
                                const k = KIND[a.kind];
                                return (
                                    <motion.li
                                        key={a.id}
                                        layout
                                        initial={{ opacity: 0, y: -18, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                        className="relative flex gap-3 pb-4 last:pb-0"
                                    >
                                        {i < items.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" aria-hidden />}
                                        <span className={cn('relative z-10 flex-shrink-0 w-8 h-8 rounded-full border border-line flex items-center justify-center', k.cls)}>
                                            <k.icon className="w-3.5 h-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1 pt-1">
                                            <p className="text-sm text-fg-2 leading-snug">
                                                <span className="font-semibold text-fg">{a.by}</span> {a.text}
                                            </p>
                                            <p className="text-[11px] text-fg-subtle mt-0.5">{k.label} · {timeAgo(a.at)}</p>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ol>
                )}
            </div>
        </DashCard>
    );
};

export default LiveFeed;
