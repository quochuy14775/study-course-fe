import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle, AlertCircle, Info, AlertTriangle,
    CheckCheck, Trash2, X, Inbox,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import type { AppNotification, NotificationType } from '../types/notification';

const POLL_INTERVAL_MS = 60_000;

const TYPE_STYLE: Record<NotificationType, { icon: any; cls: string; bg: string }> = {
    0: { icon: Info,          cls: 'text-primary-600', bg: 'bg-primary-50' },
    1: { icon: CheckCircle,   cls: 'text-code-600',    bg: 'bg-code-50' },
    2: { icon: AlertTriangle, cls: 'text-amber-600',   bg: 'bg-amber-50' },
    3: { icon: AlertCircle,   cls: 'text-rose-600',    bg: 'bg-rose-50' },
};

// "2 phút trước", "3 giờ trước", "5 ngày trước"
const formatRelative = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Vừa xong';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    const wk = Math.floor(day / 7);
    if (wk < 4) return `${wk} tuần trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
};

const NotificationDropdown: React.FC = () => {
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const [isOpen, setIsOpen]               = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [loading, setLoading]             = useState(false);
    const [filter, setFilter]               = useState<'all' | 'unread'>('all');
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch only the unread count for the bell badge (cheap, polled)
    const fetchCount = useCallback(async () => {
        if (!token) return;
        try {
            const c = await notificationService.unreadCount();
            setUnreadCount(c);
        } catch { /* silent */ }
    }, [token]);

    // Fetch full list (when dropdown opens)
    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const list = await notificationService.list({ top: 20 });
            setNotifications(list);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [token]);

    // Initial count + polling
    useEffect(() => {
        if (!token) {
            setNotifications([]); setUnreadCount(0);
            return;
        }
        fetchCount();
        pollRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [token, fetchCount]);

    // Reload list when opening
    useEffect(() => {
        if (isOpen) fetchList();
    }, [isOpen, fetchList]);

    const handleClickNotification = async (n: AppNotification) => {
        if (!n.isRead) {
            // optimistic
            setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
            setUnreadCount((c) => Math.max(0, c - 1));
            try { await notificationService.markRead(n.id); } catch { /* silent */ }
        }
        if (n.linkUrl) {
            navigate(n.linkUrl);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try { await notificationService.markAllRead(); } catch { /* silent */ }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const target = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        try { await notificationService.remove(id); } catch { /* rollback skipped */ }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm('Xoá tất cả thông báo?')) return;
        setNotifications([]); setUnreadCount(0);
        try { await notificationService.clearAll(); } catch { /* silent */ }
    };

    if (!token) return null;

    const visible = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

    return (
        <div className="relative">
            {/* Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-ink-600 hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
                aria-label="Thông báo"
            >
                <motion.div animate={unreadCount > 0 ? { rotate: [0, -10, 10, -8, 8, 0] } : {}}
                    transition={{ duration: 1.2, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 4, ease: 'easeInOut' }}>
                    <Bell size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-12' : ''}`} />
                </motion.div>
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-md ring-2 ring-white"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Click-outside overlay */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.16 }}
                            className="absolute right-0 mt-2 w-[90vw] max-w-sm sm:w-96 bg-white border border-ink-200 rounded-2xl shadow-soft-lg z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-ink-100 bg-gradient-to-r from-primary-50/40 to-accent-50/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-ink-900 text-sm">Thông báo</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold text-white bg-rose-500 rounded-full px-2 py-0.5">
                                                {unreadCount} mới
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                title="Đánh dấu đã đọc tất cả"
                                                className="p-1.5 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                            >
                                                <CheckCheck size={14} />
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={handleClearAll}
                                                title="Xoá tất cả"
                                                className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Filter tabs */}
                                <div className="flex items-center gap-1 mt-2.5">
                                    {(['all', 'unread'] as const).map((f) => (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                                                filter === f
                                                    ? 'bg-primary-600 text-white shadow-sm'
                                                    : 'text-ink-500 hover:text-ink-800 hover:bg-white'
                                            }`}>
                                            {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                                {loading && notifications.length === 0 ? (
                                    <div className="p-4 space-y-3">
                                        {[1,2,3].map((i) => (
                                            <div key={i} className="flex gap-3 animate-pulse">
                                                <div className="w-9 h-9 rounded-lg bg-ink-100" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-3/4 rounded bg-ink-100" />
                                                    <div className="h-2 w-1/3 rounded bg-ink-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : visible.length === 0 ? (
                                    <div className="px-4 py-10 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-2">
                                            <Inbox size={20} className="text-ink-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-ink-600">
                                            {filter === 'unread' ? 'Đã đọc hết!' : 'Không có thông báo'}
                                        </p>
                                        <p className="text-xs text-ink-400 mt-0.5">
                                            {filter === 'unread' ? 'Bạn đã bắt kịp mọi thứ' : 'Khi có thông báo, chúng sẽ hiện ở đây'}
                                        </p>
                                    </div>
                                ) : (
                                    <AnimatePresence initial={false}>
                                        {visible.map((n, idx) => {
                                            const cfg = TYPE_STYLE[n.type] ?? TYPE_STYLE[0];
                                            const Icon = cfg.icon;
                                            return (
                                                <motion.div
                                                    key={n.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 12, height: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    onClick={() => handleClickNotification(n)}
                                                    className={`relative px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors cursor-pointer group ${
                                                        !n.isRead ? 'bg-primary-50/40' : ''
                                                    }`}
                                                >
                                                    {/* Unread dot */}
                                                    {!n.isRead && (
                                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow-primary" />
                                                    )}

                                                    <div className="flex gap-3 pl-2">
                                                        {/* Icon */}
                                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                                                            <Icon size={16} className={cfg.cls} />
                                                        </div>

                                                        {/* Body */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm leading-snug ${
                                                                !n.isRead ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'
                                                            }`}>
                                                                {n.message}
                                                            </p>
                                                            <p className="text-[11px] text-ink-400 mt-1 font-mono">
                                                                {formatRelative(n.createdAt)}
                                                            </p>
                                                        </div>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={(e) => handleDelete(n.id, e)}
                                                            className="flex-shrink-0 w-6 h-6 rounded-md text-ink-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center self-start"
                                                            title="Xoá thông báo"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/40 text-center">
                                    <button
                                        onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        Xem tất cả thông báo →
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
