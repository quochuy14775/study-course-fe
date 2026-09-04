import React from 'react';
import { Home, BookOpen, FileText, Settings, ChevronLeft, Sparkles, X, Code2, Layers, Award } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const collapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
    const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
    const closeMobile = useUiStore((s) => s.closeSidebarMobile);

    const menuItems = [
        { icon: Home,     label: 'Trang chủ', path: '/',         roles: ['Guest', 'User'] },
        { icon: BookOpen, label: 'Lộ trình',  path: '/roadmap',  roles: ['Guest', 'User'] },
        { icon: FileText, label: 'Bài viết',  path: '/articles', roles: ['Guest', 'User'] },
        { icon: Settings, label: 'Quản lý khóa học',       path: '/management',            roles: ['Admin'] },
        { icon: Code2,    label: 'Ngôn ngữ',                path: '/management/languages',  roles: ['Admin'] },
        { icon: Layers,   label: 'Framework',               path: '/management/frameworks', roles: ['Admin'] },
        { icon: Award,    label: 'Chứng chỉ',               path: '/management/certificates', roles: ['Admin'] },
    ];

    // Guest (chưa đăng nhập) → role = '' → map sang 'Guest'
    const effectiveRole = user?.role || 'Guest';
    const filteredMenu = menuItems.filter(item =>
        item.roles.includes(effectiveRole)
    );

    const isActive = (path: string) => location.pathname === path;

    // Mobile drawer always shows labels; desktop respects collapsed flag
    const showLabels = mobileOpen || !collapsed;

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={closeMobile}
                    className="md:hidden fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
                    aria-hidden
                />
            )}

            <aside
                className={[
                    'bg-white/90 backdrop-blur-xl border-r border-ink-200',
                    'fixed left-0 top-16 h-[calc(100vh-64px)]',
                    'overflow-y-auto overflow-x-hidden z-40 flex flex-col',
                    // Animate both width (collapse on desktop) and transform (slide on mobile)
                    'transition-[transform,width] duration-300 ease-out',
                    'w-72 max-w-[85vw] md:max-w-none',
                    collapsed ? 'md:w-20' : 'md:w-64',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                ].join(' ')}
            >
                {/* Mobile close button */}
                <div className="md:hidden flex justify-end p-2">
                    <button
                        onClick={closeMobile}
                        className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                        aria-label="Đóng menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="px-3 py-2 md:py-6 flex-1">
                    <ul className="space-y-1.5">
                        {filteredMenu.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={closeMobile}
                                        title={!showLabels ? item.label : undefined}
                                        className={[
                                            'relative flex items-center rounded-xl transition-colors group',
                                            showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto',
                                            active
                                                ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 shadow-sm'
                                                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                                        ].join(' ')}
                                    >
                                        {/* Active indicator bar — only when expanded */}
                                        {active && showLabels && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-600 rounded-r-full shadow-glow-primary" />
                                        )}
                                        {/* Active dot — when collapsed */}
                                        {active && !showLabels && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 shadow-glow-primary" />
                                        )}

                                        <item.icon
                                            className={`w-5 h-5 flex-shrink-0 transition-transform ${
                                                active ? 'text-primary-600 scale-110' : 'group-hover:scale-110'
                                            }`}
                                            strokeWidth={active ? 2.5 : 2}
                                        />

                                        {showLabels && (
                                            <span
                                                className={`text-sm whitespace-nowrap overflow-hidden ${
                                                    active ? 'font-semibold' : 'font-medium'
                                                }`}
                                            >
                                                {item.label}
                                            </span>
                                        )}

                                        {/* Tooltip on hover when collapsed */}
                                        {!showLabels && (
                                            <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 rounded-md bg-ink-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-soft-lg transition-opacity duration-150">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Promo card — full when expanded, mini icon when collapsed */}
                    {showLabels ? (
                        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white relative overflow-hidden animate-fade-in">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                            <Sparkles className="w-5 h-5 mb-2" />
                            <p className="text-sm font-semibold leading-tight mb-1">Nâng cấp Pro</p>
                            <p className="text-xs text-white/80 mb-3 leading-relaxed">
                                Truy cập không giới hạn vào tất cả khóa học
                            </p>
                            <button className="w-full bg-white text-primary-700 text-xs font-semibold py-1.5 rounded-lg hover:bg-ink-50 transition-colors">
                                Khám phá
                            </button>
                        </div>
                    ) : (
                        <button
                            title="Nâng cấp Pro"
                            className="hidden md:flex mt-4 mx-auto w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow-primary hover:scale-105 transition-transform group relative"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md bg-ink-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-soft-lg transition-opacity duration-150">
                                Nâng cấp Pro
                            </span>
                        </button>
                    )}
                </nav>

                {/* Desktop-only collapse toggle */}
                <div className="hidden md:block p-3 border-t border-ink-200">
                    <button
                        onClick={toggleCollapsed}
                        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                        className="w-full flex items-center justify-center gap-2 py-2 text-ink-500 hover:text-primary-600 hover:bg-ink-100 rounded-lg transition-colors text-xs font-medium"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        {!collapsed && <span>Thu gọn</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
