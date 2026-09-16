import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Bookmark, Settings, LogOut, BookOpen, ChevronDown, Code2, Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import NotificationDropdown from './NotificationDropdown';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator,
} from './ui/DropdownMenu';
import { cn } from '../lib/cn';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const Header: React.FC = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const toggleMobile = useUiStore((s) => s.toggleSidebarMobile);
    const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
    const openPalette = useUiStore((s) => s.setCommandPaletteOpen);

    const name = user?.name || user?.email || 'User';
    const email = user?.email || '';
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const handleLogout = () => {
        Cookies.remove('token');
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
            <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    {/* Left: hamburger + logo */}
                    <div className="flex items-center gap-2 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMobile}
                            className="md:hidden"
                            aria-label="Mở menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </Button>

                        <button
                            className="flex items-center gap-2.5 group min-w-0 rounded-xl"
                            onClick={() => navigate('/')}
                            aria-label="Về trang chủ"
                        >
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-4deg] flex-shrink-0">
                                <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
                            </div>
                            <div className="hidden sm:flex items-baseline gap-0.5 font-mono">
                                <span className="text-fg-subtle text-xl font-semibold">&lt;</span>
                                <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                    EduHub
                                </span>
                                <span className="text-fg-subtle text-xl font-semibold">/&gt;</span>
                            </div>
                        </button>
                    </div>

                    {/* Center: search trigger (md+) — mở command palette */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
                        <button
                            onClick={() => openPalette(true)}
                            className={cn(
                                'group relative w-full flex items-center gap-3 pl-3.5 pr-2 h-10 rounded-xl text-sm text-left',
                                'border border-line bg-surface-2/60 text-fg-subtle',
                                'hover:border-primary-300 hover:bg-surface hover:text-fg-muted hover:shadow-[0_0_0_4px_rgb(var(--color-primary-500)/0.08)]',
                                'dark:hover:border-primary-500/40 transition-all duration-200',
                            )}
                            aria-label="Mở tìm kiếm"
                        >
                            <Search className="w-4 h-4 transition-colors group-hover:text-primary-500" />
                            <span className="flex-1 truncate">Tìm khóa học, đi tới trang...</span>
                            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 h-6 font-mono text-[10px] font-semibold text-fg-muted bg-surface border border-line rounded-md shadow-sm">
                                <span>{isMac ? '⌘' : 'Ctrl'}</span><span>K</span>
                            </kbd>
                        </button>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPalette(true)}
                            className="md:hidden"
                            aria-label="Tìm kiếm"
                        >
                            <Search size={18} />
                        </Button>

                        <ThemeToggle />

                        {user && <NotificationDropdown />}

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-full hover:bg-surface-2 transition-colors data-[state=open]:bg-surface-2 group"
                                        aria-label="Tài khoản"
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={name}
                                            className="w-8 h-8 rounded-full ring-2 ring-surface shadow-soft bg-surface-2"
                                        />
                                        <ChevronDown className="hidden sm:block w-4 h-4 text-fg-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-72 p-0">
                                    <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 border-b border-line">
                                        <div className="flex items-center gap-3">
                                            <img src={avatarUrl} alt={name} className="w-11 h-11 rounded-full shadow-glow-primary bg-surface-2" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-fg truncate">{name}</p>
                                                <p className="text-xs text-fg-muted truncate">{email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-1.5">
                                        <DropdownMenuItem onSelect={() => navigate('/personal')}>
                                            <User className="w-4 h-4 text-fg-muted" /> Trang cá nhân
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => navigate('/my-courses')}>
                                            <BookOpen className="w-4 h-4 text-fg-muted" /> Khóa học của tôi
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => navigate('/saved')}>
                                            <Bookmark className="w-4 h-4 text-fg-muted" /> Đã lưu
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => navigate('/settings')}>
                                            <Settings className="w-4 h-4 text-fg-muted" /> Cài đặt
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem destructive onSelect={handleLogout}>
                                            <LogOut className="w-4 h-4" /> Đăng xuất
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-9 px-3.5 text-sm" onClick={() => navigate('/login')}>
                                    Đăng nhập
                                </Button>
                                <Button size="sm" className="h-9 px-4 text-sm" onClick={() => navigate('/signup')}>
                                    Đăng ký
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

/** Nút đổi sáng/tối — icon xoay + fade khi đổi. `system` → chuyển sang giá trị ngược với hiện tại. */
const ThemeToggle: React.FC = () => {
    const themeMode = useSettingsStore((s) => s.themeMode);
    const setThemeMode = useSettingsStore((s) => s.setThemeMode);

    const isDark = themeMode === 'dark'
        || (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <Tooltip content={isDark ? 'Chế độ sáng' : 'Chế độ tối'} side="bottom">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                className="relative overflow-hidden"
            >
                <AnimatePresence initial={false} mode="wait">
                    <motion.span
                        key={isDark ? 'moon' : 'sun'}
                        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="flex"
                    >
                        {isDark ? <Moon size={18} /> : <Sun size={18} />}
                    </motion.span>
                </AnimatePresence>
            </Button>
        </Tooltip>
    );
};

export default Header;
