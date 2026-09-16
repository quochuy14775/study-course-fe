import React, { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import {
    Search, Home, BookOpen, FileText, User, Bookmark, Settings, GraduationCap,
    Sun, Moon, Monitor, PanelLeftClose, PanelLeftOpen, Loader2, ArrowRight, Sparkles,
    Layers, Code2, Award, LayoutDashboard, type LucideIcon,
} from 'lucide-react';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import courseService from '../services/courseServices';
import type { CourseSuggestion } from '../types/course';
import { cn } from '../lib/cn';

interface Action {
    id: string;
    label: string;
    hint?: string;
    icon: LucideIcon;
    keywords?: string;
    run: () => void;
}

/** Bỏ dấu + lowercase để "lo trinh" khớp "Lộ trình". */
const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/**
 * Command palette toàn app (⌘K / Ctrl+K): điều hướng nhanh, tìm khóa học, đổi giao diện.
 * Radix Dialog lo focus trap / ESC / khóa scroll; cmdk lo list + phím mũi tên.
 */
const CommandPalette: React.FC = () => {
    const open = useUiStore((s) => s.commandPaletteOpen);
    const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
    const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
    const user = useAuthStore((s) => s.user);
    const setThemeMode = useSettingsStore((s) => s.setThemeMode);
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [courses, setCourses] = useState<CourseSuggestion[]>([]);
    const [searching, setSearching] = useState(false);

    // Phím tắt toàn cục
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(!useUiStore.getState().commandPaletteOpen);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setOpen]);

    // Reset khi đóng
    useEffect(() => {
        if (!open) {
            setQuery('');
            setCourses([]);
        }
    }, [open]);

    // Gợi ý khóa học từ server, debounce 220ms
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setCourses([]);
            setSearching(false);
            return;
        }
        let cancelled = false;
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const res = await courseService.suggestCourses(q);
                if (!cancelled) setCourses(res.slice(0, 6));
            } catch {
                if (!cancelled) setCourses([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 220);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [query]);

    const go = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const role = user?.role ?? 'Guest';
    const isAdmin = role === 'Admin';

    const navActions = useMemo<Action[]>(() => {
        const items: Action[] = [
            { id: 'home',     label: isAdmin ? 'Tổng quan' : 'Trang chủ', icon: isAdmin ? LayoutDashboard : Home, keywords: 'home dashboard', run: () => go('/') },
            { id: 'roadmap',  label: 'Lộ trình',   icon: BookOpen, keywords: 'roadmap', run: () => go('/roadmap') },
            { id: 'articles', label: 'Bài viết',   icon: FileText, keywords: 'articles blog', run: () => go('/articles') },
            { id: 'pricing',  label: 'Bảng giá',   icon: Sparkles, keywords: 'pricing pro', run: () => go('/pricing') },
        ];
        if (user) {
            items.push(
                { id: 'my-courses', label: 'Khóa học của tôi', icon: GraduationCap, keywords: 'my courses', run: () => go('/my-courses') },
                { id: 'saved',      label: 'Đã lưu',           icon: Bookmark,      keywords: 'saved bookmark', run: () => go('/saved') },
                { id: 'personal',   label: 'Trang cá nhân',    icon: User,          keywords: 'profile', run: () => go('/personal') },
                { id: 'settings',   label: 'Cài đặt',          icon: Settings,      keywords: 'settings', run: () => go('/settings') },
            );
        }
        if (isAdmin) {
            items.push(
                { id: 'mgmt-courses',    label: 'Quản lý khóa học', icon: Settings, keywords: 'admin management', run: () => go('/management') },
                { id: 'mgmt-languages',  label: 'Quản lý ngôn ngữ', icon: Code2,    keywords: 'admin languages', run: () => go('/management/languages') },
                { id: 'mgmt-frameworks', label: 'Quản lý framework', icon: Layers,  keywords: 'admin frameworks', run: () => go('/management/frameworks') },
                { id: 'mgmt-certs',      label: 'Quản lý chứng chỉ', icon: Award,   keywords: 'admin certificates', run: () => go('/management/certificates') },
            );
        }
        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAdmin]);

    const uiActions = useMemo<Action[]>(() => [
        { id: 'theme-light',  label: 'Chế độ sáng',       icon: Sun,     keywords: 'light theme', run: () => { setThemeMode('light'); setOpen(false); } },
        { id: 'theme-dark',   label: 'Chế độ tối',        icon: Moon,    keywords: 'dark theme', run: () => { setThemeMode('dark'); setOpen(false); } },
        { id: 'theme-system', label: 'Theo hệ thống',     icon: Monitor, keywords: 'system theme auto', run: () => { setThemeMode('system'); setOpen(false); } },
        {
            id: 'sidebar',
            label: sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar',
            icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
            keywords: 'sidebar collapse',
            run: () => { toggleSidebarCollapsed(); setOpen(false); },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [sidebarCollapsed]);

    // Lọc thủ công (bỏ dấu) — cmdk tắt filter để không lọc lại kết quả từ server
    const nq = normalize(query.trim());
    const matches = (a: Action) => !nq || normalize(`${a.label} ${a.keywords ?? ''}`).includes(nq);
    const visibleNav = navActions.filter(matches);
    const visibleUi = uiActions.filter(matches);
    const nothing = !searching && courses.length === 0 && visibleNav.length === 0 && visibleUi.length === 0;

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className={cn(
                        'fixed inset-0 z-[70] bg-ink-950/50 backdrop-blur-sm',
                        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                    )}
                />
                <Dialog.Content
                    aria-describedby={undefined}
                    className={cn(
                        'fixed inset-x-4 top-[10vh] z-[70] mx-auto w-auto max-w-[640px] outline-none',
                        'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
                    )}
                >
                    <Dialog.Title className="sr-only">Tìm kiếm và lệnh nhanh</Dialog.Title>

                    <Command
                        shouldFilter={false}
                        loop
                        label="Tìm kiếm và lệnh nhanh"
                        className={cn(
                            'overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl',
                            'shadow-[0_24px_80px_-12px_rgb(15_23_42/0.35)]',
                        )}
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 border-b border-line px-4">
                            {searching
                                ? <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
                                : <Search className="w-4 h-4 text-fg-subtle flex-shrink-0" />}
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Tìm khóa học, đi tới trang, đổi giao diện..."
                                className="flex-1 h-14 bg-transparent text-[15px] text-fg placeholder:text-fg-subtle outline-none"
                            />
                            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border border-line bg-surface-2 font-mono text-[10px] font-semibold text-fg-subtle">
                                ESC
                            </kbd>
                        </div>

                        <Command.List
                            className={cn(
                                'max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2',
                                '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2',
                                '[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold',
                                '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle',
                            )}
                        >
                            {nothing && (
                                <div className="py-10 text-center">
                                    <p className="text-sm font-medium text-fg-2">Không tìm thấy kết quả</p>
                                    <p className="text-xs text-fg-subtle mt-1">Thử từ khóa khác hoặc gõ tên trang.</p>
                                </div>
                            )}

                            {courses.length > 0 && (
                                <Command.Group heading="Khóa học">
                                    {courses.map((c) => (
                                        <PaletteItem
                                            key={`course-${c.id}`}
                                            value={`course-${c.id}`}
                                            onSelect={() => go(`/courses/${c.id}`)}
                                            icon={GraduationCap}
                                            label={c.title}
                                            hint="Mở khóa học"
                                        />
                                    ))}
                                </Command.Group>
                            )}

                            {visibleNav.length > 0 && (
                                <Command.Group heading="Điều hướng">
                                    {visibleNav.map((a) => (
                                        <PaletteItem key={a.id} value={a.id} onSelect={a.run} icon={a.icon} label={a.label} />
                                    ))}
                                </Command.Group>
                            )}

                            {visibleUi.length > 0 && (
                                <Command.Group heading="Giao diện">
                                    {visibleUi.map((a) => (
                                        <PaletteItem key={a.id} value={a.id} onSelect={a.run} icon={a.icon} label={a.label} />
                                    ))}
                                </Command.Group>
                            )}
                        </Command.List>

                        {/* Footer hints */}
                        <div className="flex items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-[11px] text-fg-subtle">
                            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> di chuyển</span>
                            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> chọn</span>
                            <span className="ml-auto hidden sm:flex items-center gap-1.5"><Kbd>⌘</Kbd><Kbd>K</Kbd> mở / đóng</span>
                        </div>
                    </Command>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-line bg-surface px-1 font-mono text-[10px] font-semibold text-fg-muted">
        {children}
    </kbd>
);

interface PaletteItemProps {
    value: string;
    label: string;
    hint?: string;
    icon: LucideIcon;
    onSelect: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ value, label, hint, icon: Icon, onSelect }) => (
    <Command.Item
        value={value}
        onSelect={onSelect}
        className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer select-none',
            'text-fg-2 transition-colors',
            'data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-700',
            'dark:data-[selected=true]:bg-primary-500/15 dark:data-[selected=true]:text-primary-200',
        )}
    >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted group-data-[selected=true]:border-primary-200 group-data-[selected=true]:bg-primary-100 group-data-[selected=true]:text-primary-600 dark:group-data-[selected=true]:border-primary-500/30 dark:group-data-[selected=true]:bg-primary-500/20 dark:group-data-[selected=true]:text-primary-300 transition-colors">
            <Icon className="w-4 h-4" />
        </span>
        <span className="flex-1 truncate font-medium">{label}</span>
        {hint && <span className="text-[11px] text-fg-subtle">{hint}</span>}
        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-data-[selected=true]:opacity-100 group-data-[selected=true]:translate-x-0" />
    </Command.Item>
);

export default CommandPalette;
