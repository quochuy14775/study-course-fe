import React from 'react';
import { motion } from 'framer-motion';
import { Home, BookOpen, FileText, Settings, ChevronLeft, Sparkles, X, Code2, Layers, Award, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../lib/cn';

interface MenuItem {
    icon: LucideIcon;
    label: string;
    path: string;
    roles: string[];
}

const MENU: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/', roles: ['Admin'] },
    { icon: Home,     label: 'Trang chủ', path: '/',         roles: ['Guest', 'User'] },
    { icon: BookOpen, label: 'Lộ trình',  path: '/roadmap',  roles: ['Guest', 'User'] },
    { icon: FileText, label: 'Bài viết',  path: '/articles', roles: ['Guest', 'User'] },
    { icon: Settings, label: 'Quản lý khóa học', path: '/management',              roles: ['Admin'] },
    { icon: Code2,    label: 'Ngôn ngữ',         path: '/management/languages',    roles: ['Admin'] },
    { icon: Layers,   label: 'Framework',        path: '/management/frameworks',   roles: ['Admin'] },
    { icon: Award,    label: 'Chứng chỉ',        path: '/management/certificates', roles: ['Admin'] },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const collapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
    const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
    const closeMobile = useUiStore((s) => s.closeSidebarMobile);

    // Guest (chưa đăng nhập) → role = '' → map sang 'Guest'
    const effectiveRole = user?.role || 'Guest';
    const menu = MENU.filter((item) => item.roles.includes(effectiveRole));

    const isActive = (path: string) => location.pathname === path;

    // Mobile drawer always shows labels; desktop respects collapsed flag
    const showLabels = mobileOpen || !collapsed;

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={closeMobile}
                    className="md:hidden fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
                    aria-hidden
                />
            )}

            <aside
                className={cn(
                    'fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col',
                    'bg-surface/90 backdrop-blur-xl border-r border-line',
                    'overflow-y-auto overflow-x-hidden',
                    // Animate both width (collapse on desktop) and transform (slide on mobile)
                    'transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    'w-72 max-w-[85vw] md:max-w-none',
                    collapsed ? 'md:w-20' : 'md:w-64',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                )}
            >
                {/* Mobile close button */}
                <div className="md:hidden flex justify-end p-2">
                    <button
                        onClick={closeMobile}
                        className="p-2 rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
                        aria-label="Đóng menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="px-3 py-2 md:py-5 flex-1">
                    {showLabels && (
                        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                            Menu
                        </p>
                    )}
                    <ul className="space-y-1">
                        {menu.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <li key={item.path}>
                                    <Tooltip content={item.label} side="right" sideOffset={12} disabled={showLabels}>
                                        <Link
                                            to={item.path}
                                            onClick={closeMobile}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                'relative flex items-center rounded-xl group outline-none',
                                                'transition-colors duration-200',
                                                showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto',
                                                active
                                                    ? 'text-primary-700 dark:text-primary-200'
                                                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                                            )}
                                        >
                                            {/* Active pill — trượt mượt giữa các item nhờ layoutId */}
                                            {active && (
                                                <motion.span
                                                    layoutId="sidebar-active-pill"
                                                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                                    className={cn(
                                                        'absolute inset-0 rounded-xl',
                                                        'bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/15 dark:to-accent-500/10',
                                                        'shadow-[inset_0_0_0_1px_rgb(var(--color-primary-500)/0.15)]',
                                                    )}
                                                />
                                            )}
                                            {/* Thanh chỉ báo bên trái khi mở rộng */}
                                            {active && showLabels && (
                                                <motion.span
                                                    layoutId="sidebar-active-bar"
                                                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-600 shadow-glow-primary"
                                                />
                                            )}

                                            <item.icon
                                                className={cn(
                                                    'relative z-10 w-5 h-5 flex-shrink-0 transition-transform duration-200',
                                                    active ? 'text-primary-600 dark:text-primary-300' : 'group-hover:scale-110',
                                                )}
                                                strokeWidth={active ? 2.5 : 2}
                                            />

                                            {showLabels && (
                                                <span className={cn('relative z-10 text-sm whitespace-nowrap overflow-hidden', active ? 'font-semibold' : 'font-medium')}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    </Tooltip>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Promo card — full when expanded, mini icon when collapsed */}
                    {showLabels ? (
                        <div className="relative mt-6 p-4 rounded-2xl overflow-hidden text-white animate-fade-in bg-gradient-to-br from-primary-600 via-primary-600 to-accent-600 shadow-[0_12px_30px_-10px_rgb(var(--color-primary-600)/0.6)]">
                            <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay pointer-events-none" />
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center mb-3">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-bold leading-tight mb-1">Nâng cấp Pro</p>
                                <p className="text-xs text-white/80 mb-3 leading-relaxed">
                                    Mở khóa toàn bộ khóa học và chứng chỉ.
                                </p>
                                <button
                                    onClick={() => { closeMobile(); navigate('/pricing'); }}
                                    // !bg-white: tránh bị legacy dark-mode bridge (html.dark .bg-white) đổi sang màu surface
                                    className="w-full !bg-white text-primary-700 text-xs font-semibold py-2 rounded-lg hover:!bg-white/90 active:scale-[0.98] transition-all"
                                >
                                    Khám phá
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Tooltip content="Nâng cấp Pro" side="right" sideOffset={12}>
                            <button
                                onClick={() => navigate('/pricing')}
                                className="hidden md:flex mt-4 mx-auto w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow-primary hover:scale-105 active:scale-95 transition-transform"
                                aria-label="Nâng cấp Pro"
                            >
                                <Sparkles className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    )}
                </nav>

                {/* Desktop-only collapse toggle */}
                <div className="hidden md:block p-3 border-t border-line">
                    <Tooltip content={collapsed ? 'Mở rộng' : 'Thu gọn'} side="right" sideOffset={12} disabled={!collapsed}>
                        <button
                            onClick={toggleCollapsed}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-fg-muted hover:text-primary-600 hover:bg-surface-2 transition-colors"
                            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                        >
                            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
                            {!collapsed && <span>Thu gọn</span>}
                        </button>
                    </Tooltip>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
