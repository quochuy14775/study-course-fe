import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, BookOpen, Bell, Keyboard, ShieldAlert, User,
    ChevronRight, Check, RotateCcw, LogOut, Trash2,
    Zap, Volume2, VolumeX, Clock, Target, Play, BarChart3,
    Type, PanelLeft, Sparkles, Camera, Lock,
    Eye, EyeOff, Save, X, AlertCircle, Sun, Moon, Laptop,
} from 'lucide-react';
import { useSettingsStore, type AccentColor, type FontSize, type ThemeMode } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { showToast } from '../components/CustomToast';
import userService from '../services/userService';

// ── Primitives ────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    value, onChange, disabled,
}) => (
    <button type="button" disabled={disabled} onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${value ? 'bg-primary-600' : 'bg-ink-200'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const Row: React.FC<{ icon?: React.ReactNode; label: string; desc?: string; children: React.ReactNode }> = ({
    icon, label, desc, children,
}) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-ink-100 last:border-0">
        <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center flex-shrink-0 text-ink-500">{icon}</div>}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{label}</p>
                {desc && <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{desc}</p>}
            </div>
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-2">
        <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest px-1 mb-1">{title}</p>
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft px-4">{children}</div>
    </div>
);

// ── Password input ────────────────────────────────────────────────────────────

const PasswordInput: React.FC<{
    value: string; onChange: (v: string) => void; placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 pr-10 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
            />
            <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'profile',       icon: User,        label: 'Tài khoản' },
    { id: 'appearance',    icon: Palette,      label: 'Giao diện' },
    { id: 'learning',      icon: BookOpen,     label: 'Học tập' },
    { id: 'notifications', icon: Bell,         label: 'Thông báo' },
    { id: 'shortcuts',     icon: Keyboard,     label: 'Phím tắt' },
    { id: 'danger',        icon: ShieldAlert,  label: 'Vùng nguy hiểm' },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Accent colors ─────────────────────────────────────────────────────────────

const ACCENT_COLORS: { id: AccentColor; label: string; cls: string; ring: string }[] = [
    { id: 'violet',  label: 'Tím',         cls: 'bg-violet-500',  ring: 'ring-violet-500' },
    { id: 'blue',    label: 'Xanh dương',  cls: 'bg-blue-500',    ring: 'ring-blue-500' },
    { id: 'emerald', label: 'Xanh lá',     cls: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { id: 'rose',    label: 'Hồng đỏ',     cls: 'bg-rose-500',    ring: 'ring-rose-500' },
    { id: 'amber',   label: 'Cam vàng',    cls: 'bg-amber-500',   ring: 'ring-amber-500' },
    { id: 'cyan',    label: 'Xanh nhạt',   cls: 'bg-cyan-500',    ring: 'ring-cyan-500' },
];

const FONT_SIZES: { id: FontSize; label: string; desc: string; size: string }[] = [
    { id: 'sm', label: 'Nhỏ',  desc: '13px', size: 'text-xs' },
    { id: 'md', label: 'Vừa',  desc: '15px', size: 'text-sm' },
    { id: 'lg', label: 'Lớn',  desc: '17px', size: 'text-base' },
];

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

const SHORTCUTS = [
    { keys: ['G', 'H'],    desc: 'Về trang chủ' },
    { keys: ['G', 'R'],    desc: 'Lộ trình học' },
    { keys: ['G', 'A'],    desc: 'Bài viết' },
    { keys: ['G', 'M'],    desc: 'Khóa học của tôi' },
    { keys: ['['],         desc: 'Bài học trước' },
    { keys: [']'],         desc: 'Bài học tiếp theo' },
    { keys: ['Ctrl', 'B'], desc: 'Thu gọn / mở rộng sidebar' },
    { keys: ['Ctrl', 'K'], desc: 'Tìm kiếm nhanh' },
    { keys: ['Esc'],       desc: 'Đóng modal / popup' },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="inline-flex items-center px-2 py-1 rounded-md bg-ink-100 border border-ink-300 text-[11px] font-mono font-semibold text-ink-700 shadow-sm">{children}</kbd>
);

// ── Avatar component ──────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; url?: string | null; size?: number }> = ({ name, url, size = 80 }) => {
    const [error, setError] = useState(false);
    const initial = name?.[0]?.toUpperCase() ?? '?';

    if (url && !error) {
        return (
            <img src={url} alt={name} onError={() => setError(true)}
                className="rounded-2xl object-cover shadow-glow-primary"
                style={{ width: size, height: size }} />
        );
    }
    return (
        <div className="rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-extrabold shadow-glow-primary"
            style={{ width: size, height: size, fontSize: size * 0.35 }}>
            {initial}
        </div>
    );
};

// ── Profile tab ───────────────────────────────────────────────────────────────

const ProfileTab: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const updateProfile = useAuthStore((s) => s.updateProfile);

    // Profile form
    const [fullName, setFullName]   = useState(user?.name ?? '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
    const [saving, setSaving]       = useState(false);
    const [dirty, setDirty]         = useState(false);

    // Password form
    const [pwOpen, setPwOpen]       = useState(false);
    const [curPw, setCurPw]         = useState('');
    const [newPw, setNewPw]         = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwSaving, setPwSaving]   = useState(false);
    const [pwError, setPwError]     = useState('');

    const handleSaveProfile = async () => {
        if (!fullName.trim()) { showToast.error('Tên hiển thị không được để trống'); return; }
        setSaving(true);
        try {
            const updated = await userService.updateProfile({
                fullName: fullName.trim(),
                avatarUrl: avatarUrl.trim() || undefined,
            });
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
            setPwOpen(false); setCurPw(''); setNewPw(''); setConfirmPw('');
        } catch (e: any) {
            const msg = e?.response?.data?.[0] ?? 'Mật khẩu hiện tại không đúng';
            setPwError(msg);
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Avatar + name card */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <Avatar name={fullName || user?.name || '?'} url={avatarUrl || user?.avatarUrl} size={80} />
                        <button
                            onClick={() => document.getElementById('avatar-url-input')?.focus()}
                            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors">
                            <Camera size={13} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-ink-700 mb-1">Tên hiển thị</label>
                            <input value={fullName}
                                onChange={(e) => { setFullName(e.target.value); setDirty(true); }}
                                placeholder="Nhập tên của bạn"
                                className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-700 mb-1">URL ảnh đại diện</label>
                            <input id="avatar-url-input" value={avatarUrl}
                                onChange={(e) => { setAvatarUrl(e.target.value); setDirty(true); }}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition-all" />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {dirty && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-ink-100">
                            <p className="text-xs text-ink-400">Bạn có thay đổi chưa lưu</p>
                            <div className="flex gap-2">
                                <button onClick={() => { setFullName(user?.name ?? ''); setAvatarUrl(user?.avatarUrl ?? ''); setDirty(false); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-ink-50 rounded-lg transition-colors">
                                    <X size={12} /> Huỷ
                                </button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleSaveProfile} disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all">
                                    {saving ? 'Đang lưu...' : <><Save size={12} /> Lưu thay đổi</>}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Account info */}
            <Section title="Thông tin tài khoản">
                <Row icon={<User size={14} />} label="Email" desc={user?.email ?? '—'}>
                    <span className="text-xs text-ink-400 bg-ink-50 px-2 py-1 rounded-lg">Không thể đổi</span>
                </Row>
                <Row icon={<User size={14} />} label="Vai trò">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        user?.role === 'Admin' ? 'bg-rose-100 text-rose-600' : 'bg-primary-100 text-primary-700'
                    }`}>{user?.role ?? 'User'}</span>
                </Row>
            </Section>

            {/* Password */}
            <Section title="Bảo mật">
                <Row icon={<Lock size={14} />} label="Mật khẩu" desc="Đổi mật khẩu đăng nhập của bạn">
                    <button onClick={() => setPwOpen(!pwOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
                        <Lock size={11} /> {pwOpen ? 'Đóng' : 'Đổi mật khẩu'}
                    </button>
                </Row>

                <AnimatePresence>
                    {pwOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden">
                            <div className="pb-4 space-y-3">
                                <PasswordInput value={curPw} onChange={setCurPw} placeholder="Mật khẩu hiện tại" />
                                <PasswordInput value={newPw} onChange={setNewPw} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" />
                                <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Xác nhận mật khẩu mới" />

                                {pwError && (
                                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                                        <AlertCircle size={12} /> {pwError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-1">
                                    <button onClick={() => { setPwOpen(false); setCurPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); }}
                                        className="px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 rounded-lg transition-colors">
                                        Huỷ
                                    </button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={handleChangePassword} disabled={pwSaving}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all">
                                        {pwSaving ? 'Đang đổi...' : <><Check size={12} /> Xác nhận</>}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Section>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { value: '7 🔥', sub: 'Streak', label: 'Ngày học liên tiếp' },
                    { value: '3',    sub: 'Courses', label: 'Khóa đã hoàn thành' },
                    { value: '24',   sub: 'Articles', label: 'Bài viết đã đọc' },
                ].map((s) => (
                    <div key={s.sub} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 text-center">
                        <p className="text-2xl font-extrabold text-ink-900">{s.value}</p>
                        <p className="text-[10px] font-semibold text-primary-600 mt-0.5">{s.sub}</p>
                        <p className="text-[10px] text-ink-400 mt-0.5 leading-tight">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Appearance tab ────────────────────────────────────────────────────────────

const THEME_MODES: { id: ThemeMode; label: string; desc: string; icon: any }[] = [
    { id: 'light',  label: 'Sáng',     desc: 'Nền trắng truyền thống', icon: Sun },
    { id: 'dark',   label: 'Tối',      desc: 'Dịu mắt khi học đêm',    icon: Moon },
    { id: 'system', label: 'Hệ thống', desc: 'Theo cài đặt thiết bị',  icon: Laptop },
];

const AppearanceTab: React.FC = () => {
    const {
        themeMode, setThemeMode,
        accentColor, setAccentColor,
        fontSize, setFontSize,
        sidebarDefaultCollapsed, setSidebarDefaultCollapsed,
        reducedMotion, setReducedMotion,
    } = useSettingsStore();

    const activeAccent = ACCENT_COLORS.find((c) => c.id === accentColor)!;

    return (
        <div className="space-y-4">
            {/* Theme mode picker */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Moon size={15} className="text-primary-600" />
                    <p className="text-sm font-bold text-ink-900">Chế độ giao diện</p>
                </div>
                <p className="text-xs text-ink-400 mb-4">Chọn giao diện sáng, tối hoặc theo hệ thống</p>
                <div className="grid grid-cols-3 gap-3">
                    {THEME_MODES.map((m) => {
                        const Icon = m.icon;
                        const active = themeMode === m.id;
                        return (
                            <button key={m.id} onClick={() => setThemeMode(m.id)}
                                className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                                    active
                                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                                        : 'border-ink-200 hover:border-ink-300 bg-white'
                                }`}>
                                {/* Mini preview swatch */}
                                <div className={`w-full h-12 rounded-lg overflow-hidden border ${
                                    m.id === 'light' ? 'border-ink-200 bg-white'
                                    : m.id === 'dark' ? 'border-ink-700 bg-ink-900'
                                    : 'border-ink-200 bg-gradient-to-br from-white via-ink-300 to-ink-900'
                                } flex items-center justify-center`}>
                                    <Icon size={18} className={
                                        m.id === 'light' ? 'text-amber-500'
                                        : m.id === 'dark' ? 'text-primary-300'
                                        : 'text-ink-500'
                                    } />
                                </div>
                                <p className="text-xs font-semibold text-ink-900">{m.label}</p>
                                <p className="text-[10px] text-ink-400 text-center leading-tight">{m.desc}</p>
                                {active && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                        <Check size={11} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* Accent color picker */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Palette size={15} className="text-primary-600" />
                    <p className="text-sm font-bold text-ink-900">Màu chủ đạo</p>
                    <span className="ml-auto text-xs font-semibold text-ink-500 bg-ink-50 px-2.5 py-1 rounded-full border border-ink-200">{activeAccent.label}</span>
                </div>
                <p className="text-xs text-ink-400 mb-4">Áp dụng ngay cho toàn bộ ứng dụng</p>

                <div className="flex items-center gap-3 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                        <button key={c.id} onClick={() => setAccentColor(c.id)} title={c.label}
                            className={`relative w-11 h-11 rounded-xl ${c.cls} transition-all hover:scale-110 flex items-center justify-center shadow-md ${
                                accentColor === c.id ? `ring-2 ring-offset-2 ${c.ring} scale-110` : ''
                            }`}>
                            {accentColor === c.id && <Check size={16} className="text-white" strokeWidth={3} />}
                        </button>
                    ))}
                </div>

                {/* Live preview strip */}
                <div className="mt-5 p-4 rounded-xl bg-ink-50 border border-ink-100 space-y-2">
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-3">Xem trước</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold shadow-sm">
                            Nút chính
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold">
                            Nút phụ
                        </button>
                        <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">Badge</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-primary-600" />
                            <div className="h-1.5 w-20 rounded-full bg-primary-200">
                                <div className="h-1.5 w-12 rounded-full bg-primary-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Font size */}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Type size={15} className="text-primary-600" />
                    <p className="text-sm font-bold text-ink-900">Cỡ chữ</p>
                </div>
                <p className="text-xs text-ink-400 mb-4">Ảnh hưởng đến toàn bộ nội dung trang</p>
                <div className="grid grid-cols-3 gap-3">
                    {FONT_SIZES.map((f) => (
                        <button key={f.id} onClick={() => setFontSize(f.id)}
                            className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all ${
                                fontSize === f.id
                                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                                    : 'border-ink-200 hover:border-ink-300 bg-white'
                            }`}>
                            <span className={`font-bold text-ink-900 ${f.size}`}>Aa</span>
                            <span className="text-[11px] font-semibold text-ink-700">{f.label}</span>
                            <span className="text-[10px] text-ink-400">{f.desc}</span>
                            {fontSize === f.id && <Check size={12} className="text-primary-600" strokeWidth={3} />}
                        </button>
                    ))}
                </div>
            </div>

            <Section title="Tuỳ chỉnh khác">
                <Row icon={<PanelLeft size={14} />} label="Thu gọn sidebar khi khởi động"
                    desc="Sidebar mở ở chế độ icon-only theo mặc định">
                    <Toggle value={sidebarDefaultCollapsed} onChange={setSidebarDefaultCollapsed} />
                </Row>
                <Row icon={<Zap size={14} />} label="Giảm chuyển động"
                    desc="Tắt animation để cải thiện hiệu năng">
                    <Toggle value={reducedMotion} onChange={setReducedMotion} />
                </Row>
            </Section>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const logout = useAuthStore((s) => s.logout);

    const {
        dailyGoalMinutes, setDailyGoalMinutes,
        autoPlayNext, setAutoPlayNext,
        showProgressBar, setShowProgressBar,
        reminderEnabled, setReminderEnabled,
        reminderTime, setReminderTime,
        notifyNewCourse, setNotifyNewCourse,
        notifyComments, setNotifyComments,
        notifyArticles, setNotifyArticles,
        resetAll,
    } = useSettingsStore();

    const handleReset = () => { resetAll(); showToast.success('Đã khôi phục cài đặt mặc định'); };
    const handleLogout = () => { logout(); window.location.href = '/'; };

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-40" />
            <motion.div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-300/20 blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-1">
                        <span className="text-ink-400">~/</span>
                        <span>settings</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-ink-900">Cài đặt</h1>
                    <p className="text-sm text-ink-500 mt-0.5">Tuỳ chỉnh trải nghiệm học của bạn</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar nav */}
                    <nav className="w-full md:w-52 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-2 md:sticky md:top-6">
                            {TABS.map((tab) => {
                                const active = activeTab === tab.id;
                                const isDanger = tab.id === 'danger';
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            active
                                                ? isDanger ? 'bg-rose-50 text-rose-600' : 'bg-primary-50 text-primary-700 shadow-sm'
                                                : isDanger ? 'text-rose-400 hover:bg-rose-50 hover:text-rose-600' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                                        }`}>
                                        <tab.icon size={15} className="flex-shrink-0" />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {active && <ChevronRight size={13} className="opacity-40" />}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

                                {activeTab === 'profile'       && <ProfileTab />}
                                {activeTab === 'appearance'    && <AppearanceTab />}

                                {activeTab === 'learning' && (
                                    <div className="space-y-4">
                                        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target size={15} className="text-primary-600" />
                                                <p className="text-sm font-bold text-ink-900">Mục tiêu học mỗi ngày</p>
                                                <span className="ml-auto text-sm font-extrabold text-primary-600">{dailyGoalMinutes} phút</span>
                                            </div>
                                            <p className="text-xs text-ink-400 mb-4">Đặt thời gian học để duy trì streak</p>
                                            <input type="range" min={5} max={120} step={5} value={dailyGoalMinutes}
                                                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                                                className="w-full accent-primary-600 cursor-pointer" />
                                            <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                                                <span>5p</span><span>30p</span><span>60p</span><span>2 giờ</span>
                                            </div>
                                            <div className="flex gap-2 mt-4 flex-wrap">
                                                {[10, 20, 30, 60].map((m) => (
                                                    <button key={m} onClick={() => setDailyGoalMinutes(m)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                            dailyGoalMinutes === m ? 'bg-primary-600 text-white border-primary-600' : 'border-ink-200 text-ink-600 hover:border-primary-300'
                                                        }`}>{m} phút</button>
                                                ))}
                                            </div>
                                        </div>
                                        <Section title="Trải nghiệm">
                                            <Row icon={<Play size={14} />} label="Tự động chuyển bài" desc="Sang bài tiếp theo khi hoàn thành">
                                                <Toggle value={autoPlayNext} onChange={setAutoPlayNext} />
                                            </Row>
                                            <Row icon={<BarChart3 size={14} />} label="Hiển thị thanh tiến độ">
                                                <Toggle value={showProgressBar} onChange={setShowProgressBar} />
                                            </Row>
                                        </Section>
                                        <Section title="Nhắc nhở">
                                            <Row icon={<Clock size={14} />} label="Bật nhắc nhở học hằng ngày">
                                                <Toggle value={reminderEnabled} onChange={setReminderEnabled} />
                                            </Row>
                                            {reminderEnabled && (
                                                <Row icon={<Bell size={14} />} label="Giờ nhắc nhở">
                                                    <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                                                        className="px-3 py-1.5 border border-ink-200 rounded-lg text-sm font-mono text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
                                                </Row>
                                            )}
                                        </Section>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-5 text-white relative overflow-hidden">
                                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                                            <Bell size={20} className="mb-2" />
                                            <p className="font-bold">Thông báo</p>
                                            <p className="text-xs text-white/80 mt-1">Kiểm soát loại thông báo bạn muốn nhận</p>
                                        </div>
                                        <Section title="Nền tảng">
                                            <Row icon={<Sparkles size={14} />} label="Khoá học mới" desc="Khi có khoá học mới được đăng tải">
                                                <Toggle value={notifyNewCourse} onChange={setNotifyNewCourse} />
                                            </Row>
                                            <Row icon={<Volume2 size={14} />} label="Bình luận & Q&A" desc="Khi có người trả lời bình luận của bạn">
                                                <Toggle value={notifyComments} onChange={setNotifyComments} />
                                            </Row>
                                            <Row icon={<VolumeX size={14} />} label="Bài viết mới" desc="Khi có bài viết từ tác giả bạn theo dõi">
                                                <Toggle value={notifyArticles} onChange={setNotifyArticles} />
                                            </Row>
                                        </Section>
                                    </div>
                                )}

                                {activeTab === 'shortcuts' && (
                                    <div className="space-y-4">
                                        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
                                            <div className="px-5 py-4 border-b border-ink-100 bg-ink-50 flex items-center gap-2">
                                                <Keyboard size={15} className="text-primary-600" />
                                                <p className="text-sm font-bold text-ink-900">Phím tắt</p>
                                                <span className="ml-auto text-xs text-ink-400">{SHORTCUTS.length} tổ hợp</span>
                                            </div>
                                            <div className="divide-y divide-ink-50">
                                                {SHORTCUTS.map((s, i) => (
                                                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-ink-50/60 transition-colors">
                                                        <span className="text-sm text-ink-700">{s.desc}</span>
                                                        <div className="flex items-center gap-1">
                                                            {s.keys.map((k, j) => (
                                                                <React.Fragment key={k}>
                                                                    {j > 0 && <span className="text-ink-300 text-xs mx-0.5">+</span>}
                                                                    <Kbd>{k}</Kbd>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-sm text-primary-700 flex items-start gap-3">
                                            <Sparkles size={15} className="flex-shrink-0 mt-0.5" />
                                            Nhấn <Kbd>?</Kbd> ở bất kỳ đâu để xem nhanh danh sách phím tắt.
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'danger' && (
                                    <div className="space-y-4">
                                        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShieldAlert size={16} className="text-rose-600" />
                                                <p className="text-sm font-bold text-rose-800">Vùng nguy hiểm</p>
                                            </div>
                                            <p className="text-xs text-rose-500">Các thao tác dưới đây không thể hoàn tác.</p>
                                        </div>
                                        <Section title="Cài đặt">
                                            <Row icon={<RotateCcw size={14} />} label="Khôi phục mặc định" desc="Đặt lại toàn bộ tuỳ chỉnh">
                                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    onClick={handleReset}
                                                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors">
                                                    Khôi phục
                                                </motion.button>
                                            </Row>
                                        </Section>
                                        <Section title="Phiên đăng nhập">
                                            <Row icon={<LogOut size={14} />} label="Đăng xuất" desc="Kết thúc phiên hiện tại">
                                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    onClick={handleLogout}
                                                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors">
                                                    Đăng xuất
                                                </motion.button>
                                            </Row>
                                        </Section>
                                        <Section title="Tài khoản">
                                            <Row icon={<Trash2 size={14} />} label="Xoá tài khoản" desc="Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu">
                                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => showToast.error('Tính năng đang phát triển')}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                                                    Xoá tài khoản
                                                </motion.button>
                                            </Row>
                                        </Section>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SettingsPage;
