import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, BookOpen, Bell, Keyboard, ShieldAlert, User,
    Check, RotateCcw, LogOut, Trash2, Zap, Volume2, VolumeX, Clock, Target, Play, BarChart3,
    PanelLeft, Sparkles, Camera, Lock, Eye, EyeOff, Save, X, AlertCircle, Sun, Moon, Laptop,
    Settings as SettingsIcon, type LucideIcon,
} from 'lucide-react';
import { useSettingsStore, type AccentColor, type FontSize, type ThemeMode } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { showToast } from '../components/CustomToast';
import userService from '../services/userService';
import { useMyActivity } from '../hooks/useMyActivity';
import { MacWindow } from '../components/ui/MacWindow';
import { PageTitle } from '../components/ui/PageTitle';
import { TermCommand, TermKey } from '../components/ui/Terminal';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Primitives — hàng cài đặt kiểu System Settings: nhãn trái, điều khiển phải
   ───────────────────────────────────────────────────────────── */

const INPUT = 'w-full h-9 px-3 rounded-lg border border-line bg-surface text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-[border-color,box-shadow]';

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={cn(
            'relative inline-flex h-[22px] w-[38px] flex-shrink-0 rounded-full border border-black/10 dark:border-white/10 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:opacity-40',
            value ? 'bg-primary-600' : 'bg-surface-3',
        )}
    >
        <span className={cn('absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.3)] transition-transform duration-200', value && 'translate-x-4')} />
    </button>
);

const Row: React.FC<{ icon?: LucideIcon; label: string; desc?: React.ReactNode; children?: React.ReactNode }> = ({ icon: Icon, label, desc, children }) => (
    <div className="flex items-center justify-between gap-4 px-4 py-3 min-h-[3.25rem]">
        <div className="flex items-center gap-3 min-w-0">
            {Icon && (
                <span className="flex w-7 h-7 items-center justify-center rounded-md border border-line bg-surface text-fg-muted flex-shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                </span>
            )}
            <div className="min-w-0">
                <p className="text-[13px] font-medium text-fg">{label}</p>
                {desc && <p className="text-[11.5px] text-fg-muted mt-0.5 leading-snug">{desc}</p>}
            </div>
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
    </div>
);

/** Nhóm cài đặt: nhãn mono `// key` phía trên, các Row bên trong khung có divider. */
const Group: React.FC<{ label: string; children: React.ReactNode; tone?: 'default' | 'danger' }> = ({ label, children, tone = 'default' }) => (
    <section>
        <TermKey className="block px-1 mb-1.5">{label}</TermKey>
        <div className={cn('rounded-lg border divide-y', tone === 'danger' ? 'border-rose-300/60 divide-rose-200/60 dark:border-rose-500/30 dark:divide-rose-500/20' : 'border-line divide-line-2')}>
            {children}
        </div>
    </section>
);

/** Ô chọn kiểu radio-card (theme, cỡ chữ). */
const Choice: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; className?: string }> = ({ active, onClick, children, className }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
            'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
            active ? 'border-primary-400 bg-primary-500/[0.06] dark:bg-primary-500/10' : 'border-line hover:border-line hover:bg-surface-2',
            className,
        )}
    >
        {children}
        {active && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
            </span>
        )}
    </button>
);

const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(INPUT, 'pr-9')} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg-2">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
};

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="inline-flex items-center h-6 px-1.5 rounded-md border border-line bg-surface-2 font-mono text-[11px] font-semibold text-fg-2 shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)]">{children}</kbd>
);

/* ─────────────────────────────────────────────────────────────
   Bảng tra
   ───────────────────────────────────────────────────────────── */

const TABS = [
    { id: 'profile',       icon: User,        label: 'Tài khoản' },
    { id: 'appearance',    icon: Palette,     label: 'Giao diện' },
    { id: 'learning',      icon: BookOpen,    label: 'Học tập' },
    { id: 'notifications', icon: Bell,        label: 'Thông báo' },
    { id: 'shortcuts',     icon: Keyboard,    label: 'Phím tắt' },
    { id: 'danger',        icon: ShieldAlert, label: 'Vùng nguy hiểm' },
] as const;
type TabId = typeof TABS[number]['id'];

const ACCENT_COLORS: { id: AccentColor; label: string; cls: string }[] = [
    { id: 'violet',  label: 'Tím',        cls: 'bg-violet-500' },
    { id: 'blue',    label: 'Xanh dương', cls: 'bg-blue-500' },
    { id: 'emerald', label: 'Xanh lá',    cls: 'bg-emerald-500' },
    { id: 'rose',    label: 'Hồng đỏ',    cls: 'bg-rose-500' },
    { id: 'amber',   label: 'Cam vàng',   cls: 'bg-amber-500' },
    { id: 'cyan',    label: 'Xanh nhạt',  cls: 'bg-cyan-500' },
];

const FONT_SIZES: { id: FontSize; label: string; px: string; cls: string }[] = [
    { id: 'sm', label: 'Nhỏ', px: '13px', cls: 'text-xs' },
    { id: 'md', label: 'Vừa', px: '15px', cls: 'text-sm' },
    { id: 'lg', label: 'Lớn', px: '17px', cls: 'text-base' },
];

const THEME_MODES: { id: ThemeMode; label: string; desc: string; icon: LucideIcon }[] = [
    { id: 'light',  label: 'Sáng',     desc: 'Nền trắng',        icon: Sun },
    { id: 'dark',   label: 'Tối',      desc: 'Dịu mắt học đêm',  icon: Moon },
    { id: 'system', label: 'Hệ thống', desc: 'Theo thiết bị',    icon: Laptop },
];

/** Chỉ liệt kê phím tắt app thật sự bắt: ⌘K ở CommandPalette, Esc do Radix Dialog xử lý. */
const SHORTCUTS = [
    { keys: ['Ctrl', 'K'], desc: 'Tìm kiếm & điều hướng nhanh' },
    { keys: ['Esc'],       desc: 'Đóng hộp thoại / bảng lệnh' },
];

/* ─────────────────────────────────────────────────────────────
   Page — cửa sổ System Settings: sidebar danh mục + panel
   ───────────────────────────────────────────────────────────── */

const SettingsPage: React.FC = () => {
    const [tab, setTab] = useState<TabId>('profile');
    const current = TABS.find((t) => t.id === tab)!;

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                <PageTitle path="settings" title="Cài đặt" subtitle="Tuỳ chỉnh trải nghiệm học của bạn" />

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    <MacWindow
                        title={<><SettingsIcon className="w-3.5 h-3.5 text-fg-muted" /> System Settings</>}
                        footer={<>{TABS.length} mục<span className="ml-auto text-fg-subtle">~/settings/{tab}</span></>}
                    >
                        <div className="flex min-h-[34rem]">
                            {/* Sidebar (md+) */}
                            <aside className="hidden md:flex w-52 flex-shrink-0 flex-col gap-0.5 p-3 border-r border-line bg-surface-2/40">
                                {TABS.map((t) => <SideItem key={t.id} tab={t} active={tab === t.id} onClick={() => setTab(t.id)} />)}
                            </aside>

                            <div className="min-w-0 flex-1 flex flex-col">
                                {/* Chip trên màn hẹp (thay sidebar) */}
                                <div className="md:hidden flex gap-1.5 px-3 py-2 border-b border-line overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {TABS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTab(t.id)}
                                            className={cn(
                                                'flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] whitespace-nowrap transition-colors',
                                                tab === t.id
                                                    ? t.id === 'danger' ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300'
                                                        : 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/15 dark:text-primary-300'
                                                    : 'border-line text-fg-muted',
                                            )}
                                        >
                                            <t.icon className="w-3.5 h-3.5" /> {t.label}
                                        </button>
                                    ))}
                                </div>

                                <TermCommand cmd="defaults read" flags={`com.eduhub.${tab}`} />

                                <div className="flex-1 p-4 sm:p-5">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={tab}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                            className="space-y-5"
                                        >
                                            <h2 className="sr-only">{current.label}</h2>
                                            {tab === 'profile'       && <ProfilePanel />}
                                            {tab === 'appearance'    && <AppearancePanel />}
                                            {tab === 'learning'      && <LearningPanel />}
                                            {tab === 'notifications' && <NotificationsPanel />}
                                            {tab === 'shortcuts'     && <ShortcutsPanel />}
                                            {tab === 'danger'        && <DangerPanel />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </MacWindow>
                </motion.div>
            </div>
        </main>
    );
};

const SideItem: React.FC<{ tab: typeof TABS[number]; active: boolean; onClick: () => void }> = ({ tab, active, onClick }) => {
    const danger = tab.id === 'danger';
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'relative flex items-center gap-2.5 h-9 px-2.5 rounded-md text-[12.5px] text-left transition-colors',
                active
                    ? danger ? 'text-rose-700 dark:text-rose-300 font-medium' : 'text-primary-700 dark:text-primary-200 font-medium'
                    : danger ? 'text-rose-500/80 hover:bg-rose-500/[0.06]' : 'text-fg-2 hover:bg-surface-2',
            )}
        >
            {active && (
                <motion.span
                    layoutId="settings-side-active"
                    className={cn('absolute inset-0 rounded-md', danger ? 'bg-rose-500/15' : 'bg-primary-500/15')}
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
            )}
            <span className={cn('relative flex w-6 h-6 items-center justify-center rounded-md text-white flex-shrink-0 bg-gradient-to-br', danger ? 'from-rose-500 to-red-600' : 'from-primary-500 to-accent-500')}>
                <tab.icon className="w-3.5 h-3.5" />
            </span>
            <span className="relative truncate">{tab.label}</span>
        </button>
    );
};

/* ─────────────────────────────────────────────────────────────
   Tài khoản
   ───────────────────────────────────────────────────────────── */

const Avatar: React.FC<{ name: string; url?: string | null }> = ({ name, url }) => {
    const [error, setError] = useState(false);
    if (url && !error) {
        return <img src={url} alt={name} onError={() => setError(true)} className="w-20 h-20 rounded-2xl object-cover bg-surface-2 ring-1 ring-line" />;
    }
    return (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white font-extrabold text-2xl flex items-center justify-center ring-1 ring-line">
            {name?.[0]?.toUpperCase() ?? '?'}
        </div>
    );
};

const ProfilePanel: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const updateProfile = useAuthStore((s) => s.updateProfile);
    const activity = useMyActivity(365);

    const [fullName, setFullName]   = useState(user?.name ?? '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
    const [saving, setSaving]       = useState(false);
    const [dirty, setDirty]         = useState(false);

    const [pwOpen, setPwOpen]       = useState(false);
    const [curPw, setCurPw]         = useState('');
    const [newPw, setNewPw]         = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwSaving, setPwSaving]   = useState(false);
    const [pwError, setPwError]     = useState('');

    const resetProfile = () => { setFullName(user?.name ?? ''); setAvatarUrl(user?.avatarUrl ?? ''); setDirty(false); };
    const closePw = () => { setPwOpen(false); setCurPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); };

    const handleSaveProfile = async () => {
        if (!fullName.trim()) { showToast.error('Tên hiển thị không được để trống'); return; }
        setSaving(true);
        try {
            const updated = await userService.updateProfile({ fullName: fullName.trim(), avatarUrl: avatarUrl.trim() || undefined });
            updateProfile({ name: updated.fullName ?? fullName, avatarUrl: updated.avatarUrl });
            showToast.success('Đã cập nhật hồ sơ');
            setDirty(false);
        } catch {
            showToast.error('Cập nhật thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPwError('');
        if (!curPw) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
        if (newPw.length < 6) { setPwError('Mật khẩu mới ít nhất 6 ký tự'); return; }
        if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return; }
        setPwSaving(true);
        try {
            await userService.changePassword({ currentPassword: curPw, newPassword: newPw });
            showToast.success('Đổi mật khẩu thành công');
            closePw();
        } catch (e: any) {
            setPwError(e?.response?.data?.[0] ?? 'Mật khẩu hiện tại không đúng');
        } finally {
            setPwSaving(false);
        }
    };

    const stats = [
        { k: 'streak',  value: activity.data ? `${activity.data.currentStreak} 🔥` : '—', label: activity.data && activity.data.currentStreak > 0 && !activity.data.streakSafeToday ? 'Học hôm nay để giữ' : 'Ngày liên tiếp' },
        { k: 'lessons', value: activity.data ? String(activity.data.totalLessons) : '—', label: 'Bài đã hoàn thành' },
        { k: 'days',    value: activity.data ? String(activity.data.activeDays) : '—',   label: 'Ngày có học · 365' },
    ];

    return (
        <>
            <Group label="profile">
                <div className="p-4 flex flex-col sm:flex-row items-start gap-5">
                    <div className="relative flex-shrink-0">
                        <Avatar name={fullName || user?.name || '?'} url={avatarUrl || user?.avatarUrl} />
                        <button
                            type="button"
                            onClick={() => document.getElementById('avatar-url-input')?.focus()}
                            aria-label="Đổi ảnh đại diện"
                            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md ring-2 ring-surface hover:bg-primary-700 transition-colors"
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex-1 w-full min-w-0 space-y-3">
                        <label className="block">
                            <TermKey className="block mb-1">display_name</TermKey>
                            <input value={fullName} onChange={(e) => { setFullName(e.target.value); setDirty(true); }} placeholder="Nhập tên của bạn" className={INPUT} />
                        </label>
                        <label className="block">
                            <TermKey className="block mb-1">avatar_url</TermKey>
                            <input id="avatar-url-input" value={avatarUrl} onChange={(e) => { setAvatarUrl(e.target.value); setDirty(true); }} placeholder="https://example.com/avatar.jpg" className={cn(INPUT, 'font-mono text-[12px]')} />
                        </label>
                    </div>
                </div>
                <AnimatePresence>
                    {dirty && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between gap-3 bg-surface-2/50">
                                <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">{'// '}có thay đổi chưa lưu</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={resetProfile}><X className="w-3.5 h-3.5" /> Huỷ</Button>
                                    <Button size="sm" onClick={handleSaveProfile} loading={saving}><Save className="w-3.5 h-3.5" /> Lưu thay đổi</Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Group>

            <Group label="account">
                <Row icon={User} label="Email" desc={<span className="font-mono">{user?.email ?? '—'}</span>}>
                    <span className="font-mono text-[11px] text-fg-subtle">readonly</span>
                </Row>
                <Row icon={ShieldAlert} label="Vai trò">
                    <span className={cn('font-mono text-[11px] px-2 h-6 inline-flex items-center rounded-md border',
                        user?.role === 'Admin' ? 'border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'border-primary-300/60 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/15 dark:text-primary-300')}>
                        {user?.role ?? 'User'}
                    </span>
                </Row>
            </Group>

            <Group label="security">
                <Row icon={Lock} label="Mật khẩu" desc="Đổi mật khẩu đăng nhập của bạn">
                    <Button variant="secondary" size="sm" onClick={() => (pwOpen ? closePw() : setPwOpen(true))}>
                        <Lock className="w-3.5 h-3.5" /> {pwOpen ? 'Đóng' : 'Đổi mật khẩu'}
                    </Button>
                </Row>
                <AnimatePresence>
                    {pwOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="p-4 space-y-3 bg-surface-2/40">
                                <PasswordInput value={curPw} onChange={setCurPw} placeholder="Mật khẩu hiện tại" />
                                <PasswordInput value={newPw} onChange={setNewPw} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" />
                                <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Xác nhận mật khẩu mới" />
                                {pwError && (
                                    <p className="flex items-center gap-2 font-mono text-[11.5px] text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="w-3.5 h-3.5" /> {pwError}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button variant="ghost" size="sm" onClick={closePw}>Huỷ</Button>
                                    <Button size="sm" onClick={handleChangePassword} loading={pwSaving}><Check className="w-3.5 h-3.5" /> Xác nhận</Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Group>

            <Group label="activity">
                <div className="grid grid-cols-3 divide-x divide-line-2">
                    {stats.map((s) => (
                        <div key={s.k} className="p-4">
                            <TermKey>{s.k}</TermKey>
                            <p className="mt-2 text-xl font-extrabold tracking-tight text-fg leading-none tabular-nums">{s.value}</p>
                            <p className="text-[11px] text-fg-muted mt-1.5 truncate">{s.label}</p>
                        </div>
                    ))}
                </div>
            </Group>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────
   Giao diện
   ───────────────────────────────────────────────────────────── */

const AppearancePanel: React.FC = () => {
    const {
        themeMode, setThemeMode, accentColor, setAccentColor, fontSize, setFontSize,
        sidebarDefaultCollapsed, setSidebarDefaultCollapsed, reducedMotion, setReducedMotion,
    } = useSettingsStore();
    const activeAccent = ACCENT_COLORS.find((c) => c.id === accentColor)!;

    return (
        <>
            <Group label="appearance">
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                        {THEME_MODES.map((m) => (
                            <Choice key={m.id} active={themeMode === m.id} onClick={() => setThemeMode(m.id)}>
                                {/* Cửa sổ thu nhỏ theo chế độ — như ô Appearance của macOS */}
                                <span className={cn('w-full h-12 rounded-md border overflow-hidden flex flex-col',
                                    m.id === 'light' ? 'bg-white border-slate-200'
                                        : m.id === 'dark' ? 'bg-slate-900 border-slate-700'
                                        : 'bg-gradient-to-r from-white via-white to-slate-900 border-slate-400')}>
                                    <span className={cn('flex items-center gap-1 h-3.5 px-1.5', m.id === 'dark' ? 'bg-slate-800' : 'bg-slate-100/80')}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" /><span className="w-1.5 h-1.5 rounded-full bg-[#febc2e]" /><span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
                                    </span>
                                    <span className="flex-1 flex items-center justify-center"><m.icon className={cn('w-4 h-4', m.id === 'dark' ? 'text-primary-300' : 'text-amber-500')} /></span>
                                </span>
                                <span className="text-xs font-semibold text-fg">{m.label}</span>
                                <span className="text-[10.5px] text-fg-muted">{m.desc}</span>
                            </Choice>
                        ))}
                    </div>
                </div>
            </Group>

            <Group label="accent_color">
                <Row icon={Palette} label="Màu chủ đạo" desc="Áp dụng ngay cho toàn bộ ứng dụng">
                    <span className="font-mono text-[11px] text-fg-muted">{activeAccent.label}</span>
                </Row>
                <div className="px-4 py-3 flex items-center gap-2.5 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setAccentColor(c.id)}
                            title={c.label}
                            aria-label={c.label}
                            aria-pressed={accentColor === c.id}
                            className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ring-offset-2 ring-offset-surface', c.cls, accentColor === c.id && 'ring-2 ring-fg/40 scale-110')}
                        >
                            {accentColor === c.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </button>
                    ))}
                </div>
                <div className="px-4 py-3 bg-surface-2/40">
                    <TermKey className="block mb-2">preview</TermKey>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button size="xs">Nút chính</Button>
                        <Button size="xs" variant="soft">Nút phụ</Button>
                        <span className="h-5 px-2 inline-flex items-center rounded-md bg-primary-500/15 text-primary-700 dark:text-primary-300 text-[11px] font-semibold">Badge</span>
                        <span className="h-1.5 w-20 rounded-full bg-primary-500/20 overflow-hidden"><span className="block h-full w-3/5 rounded-full bg-primary-600" /></span>
                    </div>
                </div>
            </Group>

            <Group label="font_size">
                <div className="p-4 grid grid-cols-3 gap-3">
                    {FONT_SIZES.map((f) => (
                        <Choice key={f.id} active={fontSize === f.id} onClick={() => setFontSize(f.id)}>
                            <span className={cn('font-bold text-fg leading-none', f.cls)}>Aa</span>
                            <span className="text-xs font-semibold text-fg">{f.label}</span>
                            <span className="font-mono text-[10.5px] text-fg-muted">{f.px}</span>
                        </Choice>
                    ))}
                </div>
            </Group>

            <Group label="misc">
                <Row icon={PanelLeft} label="Thu gọn sidebar khi khởi động" desc="Sidebar mở ở chế độ chỉ icon theo mặc định">
                    <Toggle value={sidebarDefaultCollapsed} onChange={setSidebarDefaultCollapsed} />
                </Row>
                <Row icon={Zap} label="Giảm chuyển động" desc="Tắt animation của giao diện">
                    <Toggle value={reducedMotion} onChange={setReducedMotion} />
                </Row>
            </Group>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────
   Học tập
   ───────────────────────────────────────────────────────────── */

const LearningPanel: React.FC = () => {
    const {
        dailyGoalMinutes, setDailyGoalMinutes, autoPlayNext, setAutoPlayNext,
        showProgressBar, setShowProgressBar, reminderEnabled, setReminderEnabled, reminderTime, setReminderTime,
    } = useSettingsStore();

    return (
        <>
            <Group label="daily_goal">
                <Row icon={Target} label="Mục tiêu học mỗi ngày" desc="Đặt thời gian học để duy trì streak">
                    <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-300 tabular-nums">{dailyGoalMinutes} phút</span>
                </Row>
                <div className="px-4 py-3">
                    <input type="range" min={5} max={120} step={5} value={dailyGoalMinutes} onChange={(e) => setDailyGoalMinutes(Number(e.target.value))} aria-label="Mục tiêu học mỗi ngày" className="w-full accent-primary-600 cursor-pointer" />
                    <div className="flex justify-between font-mono text-[10px] text-fg-subtle mt-1"><span>5p</span><span>30p</span><span>60p</span><span>2h</span></div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                        {[10, 20, 30, 60].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setDailyGoalMinutes(m)}
                                className={cn('h-7 px-2.5 rounded-md border font-mono text-[11px] transition-colors',
                                    dailyGoalMinutes === m ? 'border-primary-400 bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-line text-fg-muted hover:bg-surface-2')}
                            >
                                {m}p
                            </button>
                        ))}
                    </div>
                </div>
            </Group>

            <Group label="experience">
                <Row icon={Play} label="Tự động chuyển bài" desc="Sang bài tiếp theo khi hoàn thành">
                    <Toggle value={autoPlayNext} onChange={setAutoPlayNext} />
                </Row>
                <Row icon={BarChart3} label="Hiển thị thanh tiến độ">
                    <Toggle value={showProgressBar} onChange={setShowProgressBar} />
                </Row>
            </Group>

            <Group label="reminder">
                <Row icon={Clock} label="Nhắc nhở học hằng ngày">
                    <Toggle value={reminderEnabled} onChange={setReminderEnabled} />
                </Row>
                {reminderEnabled && (
                    <Row icon={Bell} label="Giờ nhắc">
                        <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} aria-label="Giờ nhắc" className={cn(INPUT, 'w-auto font-mono text-[12px]')} />
                    </Row>
                )}
            </Group>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────
   Thông báo · Phím tắt · Vùng nguy hiểm
   ───────────────────────────────────────────────────────────── */

const NotificationsPanel: React.FC = () => {
    const { notifyNewCourse, setNotifyNewCourse, notifyComments, setNotifyComments, notifyArticles, setNotifyArticles } = useSettingsStore();
    return (
        <Group label="notifications">
            <Row icon={Sparkles} label="Khoá học mới" desc="Khi có khoá học mới được đăng tải">
                <Toggle value={notifyNewCourse} onChange={setNotifyNewCourse} />
            </Row>
            <Row icon={Volume2} label="Bình luận & Q&A" desc="Khi có người trả lời bình luận của bạn">
                <Toggle value={notifyComments} onChange={setNotifyComments} />
            </Row>
            <Row icon={VolumeX} label="Bài viết mới" desc="Khi có bài viết từ tác giả bạn theo dõi">
                <Toggle value={notifyArticles} onChange={setNotifyArticles} />
            </Row>
        </Group>
    );
};

const ShortcutsPanel: React.FC = () => (
    <Group label="shortcuts">
        {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center justify-between gap-4 px-4 h-12">
                <span className="text-[13px] text-fg-2">{s.desc}</span>
                <span className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                        <React.Fragment key={k}>
                            {j > 0 && <span className="font-mono text-[11px] text-fg-subtle">+</span>}
                            <Kbd>{k}</Kbd>
                        </React.Fragment>
                    ))}
                </span>
            </div>
        ))}
    </Group>
);

const DangerPanel: React.FC = () => {
    const resetAll = useSettingsStore((s) => s.resetAll);
    const logout = useAuthStore((s) => s.logout);
    const handleReset = () => { resetAll(); showToast.success('Đã khôi phục cài đặt mặc định'); };
    const handleLogout = () => { logout(); window.location.href = '/'; };

    return (
        <>
            <p className="flex items-center gap-2 font-mono text-[11.5px] text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5" /> {'// '}các thao tác dưới đây không thể hoàn tác
            </p>
            <Group label="settings" tone="danger">
                <Row icon={RotateCcw} label="Khôi phục mặc định" desc="Đặt lại toàn bộ tuỳ chỉnh về ban đầu">
                    <Button variant="secondary" size="sm" onClick={handleReset}>Khôi phục</Button>
                </Row>
            </Group>
            <Group label="session" tone="danger">
                <Row icon={LogOut} label="Đăng xuất" desc="Kết thúc phiên hiện tại trên thiết bị này">
                    <Button variant="danger" size="sm" onClick={handleLogout}>Đăng xuất</Button>
                </Row>
            </Group>
            <Group label="account" tone="danger">
                <Row icon={Trash2} label="Xoá tài khoản" desc="Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu">
                    <Button size="sm" className="from-rose-600 to-red-600 shadow-none" onClick={() => showToast.error('Tính năng đang phát triển')}>Xoá tài khoản</Button>
                </Row>
            </Group>
        </>
    );
};

export default SettingsPage;
