import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle, AlertCircle, Info, AlertTriangle,
    CheckCheck, Trash2, Inbox, X, ArrowLeft,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { showToast } from '../components/CustomToast';
import type { AppNotification, NotificationType } from '../types/notification';

const TYPE_STYLE: Record<NotificationType, { icon: any; cls: string; bg: string; label: string }> = {
    0: { icon: Info,          cls: 'text-primary-600', bg: 'bg-primary-50',  label: 'Thông tin' },
    1: { icon: CheckCircle,   cls: 'text-code-600',    bg: 'bg-code-50',     label: 'Thành công' },
    2: { icon: AlertTriangle, cls: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Cảnh báo' },
    3: { icon: AlertCircle,   cls: 'text-rose-600',    bg: 'bg-rose-50',     label: 'Lỗi' },
};

const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState<'all' | 'unread' | 'read'>('all');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const list = await notificationService.list({ top: 100 });
            setNotifications(list);
        } catch {
            showToast.error('Không tải được thông báo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const markRead = async (id: number) => {
        setNotifications((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n));
        try { await notificationService.markRead(id); } catch { /* silent */ }
    };

    const handleClick = (n: AppNotification) => {
        if (!n.isRead) markRead(n.id);
        if (n.linkUrl) navigate(n.linkUrl);
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications((p) => p.filter((n) => n.id !== id));
        try { await notificationService.remove(id); } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
        try { await notificationService.markAllRead(); showToast.success('Đã đánh dấu đã đọc tất cả'); }
        catch { /* silent */ }
    };

    const handleClearAll = async () => {
        if (!notifications.length) return;
        if (!window.confirm('Xoá tất cả thông báo?')) return;
        setNotifications([]);
        try { await notificationService.clearAll(); showToast.success('Đã xoá tất cả'); }
        catch { /* silent */ }
    };

    const counts = {
        all:    notifications.length,
        unread: notifications.filter((n) => !n.isRead).length,
        read:   notifications.filter((n) => n.isRead).length,
    };

    const visible = filter === 'all' ? notifications
                  : filter === 'unread' ? notifications.filter((n) => !n.isRead)
                  : notifications.filter((n) => n.isRead);

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-40" />
            <motion.div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-300/15 blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />

            <div className="relative max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Back */}
                <button onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary-600 mb-4 group transition-colors">
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Quay lại
                </button>

                {/* Header */}
                <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-1">
                            <span className="text-ink-400">~/</span>
                            <span>notifications</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 flex items-center gap-2">
                            <Bell size={22} className="text-primary-600" />
                            Thông báo
                        </h1>
                        <p className="text-sm text-ink-500 mt-1">Quản lý tất cả thông báo của bạn</p>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex gap-2">
                            {counts.unread > 0 && (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors">
                                    <CheckCheck size={13} /> Đánh dấu đã đọc
                                </motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={handleClearAll}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors">
                                <Trash2 size={13} /> Xoá tất cả
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 mb-5 bg-white p-1 rounded-2xl border border-ink-100 shadow-soft w-fit">
                    {(['all', 'unread', 'read'] as const).map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filter === f
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                            }`}>
                            {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                filter === f ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500'
                            }`}>{counts[f]}</span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-2">
                        {[1,2,3,4,5].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4 animate-pulse flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-ink-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 bg-ink-100 rounded" />
                                    <div className="h-2 w-1/3 bg-ink-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-ink-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-ink-50 flex items-center justify-center mx-auto mb-3">
                            <Inbox size={28} className="text-ink-300" />
                        </div>
                        <p className="text-base font-bold text-ink-700">
                            {filter === 'all'    ? 'Chưa có thông báo nào'
                            : filter === 'unread' ? 'Đã đọc hết!'
                                                   : 'Chưa có thông báo đã đọc'}
                        </p>
                        <p className="text-sm text-ink-400 mt-1">
                            Khi có hoạt động mới, bạn sẽ nhận thông báo ở đây
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence initial={false}>
                            {visible.map((n, idx) => {
                                const cfg = TYPE_STYLE[n.type] ?? TYPE_STYLE[0];
                                const Icon = cfg.icon;
                                return (
                                    <motion.div
                                        key={n.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 24, height: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        onClick={() => handleClick(n)}
                                        className={`group relative bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-soft hover:border-primary-200 ${
                                            !n.isRead ? 'border-primary-200 bg-primary-50/30' : 'border-ink-100'
                                        }`}
                                    >
                                        {!n.isRead && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow-primary" />
                                        )}

                                        <div className="flex gap-3 pl-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                                                <Icon size={18} className={cfg.cls} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-snug ${
                                                        !n.isRead ? 'font-bold text-ink-900' : 'font-medium text-ink-700'
                                                    }`}>
                                                        {n.message}
                                                    </p>
                                                    <button onClick={(e) => handleDelete(n.id, e)}
                                                        className="flex-shrink-0 w-6 h-6 rounded-md text-ink-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.cls}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-[11px] text-ink-400 font-mono">
                                                        {formatDateTime(n.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
