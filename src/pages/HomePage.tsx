import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform, useAnimationControls, type MotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import {
    Users, BookOpen, Star, Trophy, ArrowRight, Flame, CheckCircle2,
    GitBranch, Check, Waypoints, Braces, AlertTriangle, PanelRight,
    Code2, Search, Wifi, BatteryFull, Terminal, Newspaper, Bookmark, User, Settings,
    type LucideIcon,
} from 'lucide-react';
import CourseFinder from './user/course/CourseFinder';
import { slides, freeCourses as mockFree, premiumCourses as mockPremium } from '../mockDatas/mockCourses';
import courseService from '../services/courseServices';
import { Course } from '../types/course';
import { Button } from '../components/ui/Button';
import { TrafficLights } from '../components/ui/TrafficLights';
import { MacWindow } from '../components/ui/MacWindow';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useMyActivity } from '../hooks/useMyActivity';
import { usePublicStats } from '../hooks/usePublicStats';
import type { PublicStats } from '../services/statsService';
import { cn } from '../lib/cn';

const EASE = [0.16, 1, 0.3, 1] as const;

const HomePage: React.FC = () => {
    const [freeCourses, setFreeCourses] = useState<Course[]>([]);
    const [premiumCourses, setPremiumCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const [freeRes, premiumRes] = await Promise.all([
                    courseService.getCourses({ count: true, filter: `Price eq 0`, top: 6 }),
                    courseService.getCourses({ count: true, filter: `Price gt 0`, top: 6 }),
                ]);
                setFreeCourses(freeRes.value);
                setPremiumCourses(premiumRes.value);
            } catch (err) {
                console.error('Failed to fetch courses', err);
                // Dev không có backend vẫn xem được layout thật của trang chủ.
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[HomePage] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).');
                    setFreeCourses(mockFree);
                    setPremiumCourses(mockPremium);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <main className="relative min-h-screen overflow-hidden">
            {/* Nền: grid mờ dần + 2 blob ambient rất chậm (chỉ 2, ở cấp trang) */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
            <motion.div
                className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-primary-400/15 dark:bg-primary-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-accent-400/12 dark:bg-accent-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
                transition={{ duration: 32, ease: 'easeInOut', repeat: Infinity, delay: 3 }}
            />

            <div className="relative max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Hero />
                <Stats />

                <CourseFinder id="courses" free={freeCourses} pro={premiumCourses} loading={loading} />
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Hero — màn hình MacBook của dev: menu bar macOS, cửa sổ editor
   nổi bên phải (tab, code, terminal zsh, status bar), thông báo
   kiểu macOS, và Dock có hiệu ứng phóng to ở góc dưới.
   ───────────────────────────────────────────────────────────── */

/** Con trỏ khối nhấp nháy. */
const Caret: React.FC<{ className?: string }> = ({ className }) => (
    <span className={cn('inline-block w-[7px] h-[14px] align-text-bottom ml-0.5 bg-primary-200 animate-blink', className)} aria-hidden />
);

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const openPalette = useUiStore((s) => s.setCommandPaletteOpen);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // Streak thật cho người đã đăng nhập; khách xem số minh họa
    const user = useAuthStore((s) => s.user);
    const { data: activity } = useMyActivity(30, !!user);
    const streak = user && activity ? activity.currentStreak : null;
    const { data: publicStats } = usePublicStats();

    useEffect(() => {
        if (paused) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
        return () => clearInterval(t);
    }, [paused]);

    const slide = slides[index];
    const lines = SNIPPETS[index];
    const scrollToCourses = () => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative p-1.5 sm:p-2 rounded-[22px] sm:rounded-[26px] bg-[#0b0b0d] ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgb(var(--color-primary-900)/0.8)] mb-8"
            aria-label="Giới thiệu"
        >
        {/* Màn hình bên trong bezel */}
        <div className="relative overflow-hidden rounded-2xl bg-ink-950 text-white ring-1 ring-white/[0.06]">
            {/* Notch — chỉ khi đủ rộng để không đè menu */}
            <div aria-hidden className="hidden xl:block absolute top-0 left-1/2 -translate-x-1/2 z-20 w-28 h-[18px] rounded-b-xl bg-[#0b0b0d]" />

            {/* Wallpaper: 3 vệt màu kiểu hình nền macOS + grid + noise */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(var(--color-primary-600)/0.75),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgb(var(--color-accent-600)/0.6),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(16_185_129/0.22),transparent_45%)]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]" />
            <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay pointer-events-none" />
            <div className="absolute -top-28 left-1/3 w-80 h-80 rounded-full bg-accent-400/25 blur-3xl pointer-events-none" />

            <MenuBar onSearch={() => openPalette(true)} />

            <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-stretch px-6 sm:px-10 pt-8 sm:pt-10 pb-8">
                {/* ── Left: copy + Dock ── */}
                <div className="min-w-0 flex flex-col">
                    <div className="lg:my-auto">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: EASE }}
                            >
                                <p className="inline-flex items-center gap-2 mb-4 px-2.5 h-7 rounded-md border border-code-400/25 bg-code-500/10 font-mono text-[11.5px] text-code-200">
                                    <span className="text-code-400/80 select-none">{'//'}</span>
                                    {slide.eyebrow}
                                </p>
                                <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
                                    {slide.title}{' '}
                                    <span className="bg-gradient-to-r from-primary-200 via-accent-200 to-white bg-clip-text text-transparent">
                                        {slide.highlight}
                                    </span>
                                    <span className="ml-1 text-primary-300 font-mono font-normal animate-blink select-none" aria-hidden>_</span>
                                </h1>
                                <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/75 leading-relaxed max-w-xl">
                                    {slide.desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <Button size="lg" onClick={scrollToCourses} className="group">
                                Bắt đầu học miễn phí
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                            <Button size="lg" variant="onDark" onClick={() => navigate('/roadmap')} className="font-mono text-sm">
                                <Waypoints className="w-4 h-4 text-code-300" />
                                <span><span className="text-code-300">$</span> xem lộ trình</span>
                            </Button>
                        </div>

                        {/* Social proof */}
                        <div className="mt-7 flex items-center gap-4">
                            <div className="flex -space-x-2.5">
                                {['An', 'Bao', 'Chi', 'Dung'].map((s) => (
                                    <img
                                        key={s}
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`}
                                        alt=""
                                        loading="lazy"
                                        className="w-8 h-8 rounded-full ring-2 ring-ink-950 bg-ink-800"
                                    />
                                ))}
                            </div>
                            <div className="text-xs sm:text-[13px] text-white/70 leading-tight tabular-nums">
                                {publicStats && publicStats.learners >= 10 ? (
                                    <><span className="font-semibold text-white">{publicStats.learners.toLocaleString('vi-VN')}+</span> học viên đang học</>
                                ) : (
                                    <>Tham gia cộng đồng học lập trình</>
                                )}
                                {publicStats && publicStats.averageRating > 0 && (
                                    <>
                                        <span className="mx-1.5 text-white/30">·</span>
                                        <span className="inline-flex items-center gap-1 align-middle">
                                            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                            <span className="font-semibold text-white">{publicStats.averageRating.toFixed(1)}</span>/5
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Chọn slide trên màn hẹp (cửa sổ editor bị ẩn) */}
                        <div role="tablist" aria-label="Slide" className="mt-6 flex flex-wrap gap-1.5 lg:hidden">
                            {slides.map((s, i) => (
                                <button
                                    key={s.file}
                                    role="tab"
                                    aria-selected={i === index}
                                    aria-label={`Slide ${i + 1}: ${s.eyebrow}`}
                                    onClick={() => setIndex(i)}
                                    className={cn(
                                        'flex items-center gap-1.5 h-7 px-2.5 rounded-md border font-mono text-[11px] transition-colors',
                                        i === index ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80',
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-sm" style={{ background: s.dot }} aria-hidden />
                                    {s.file}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dock — chỉ lg+, nằm trên "mặt bàn" dưới phần copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
                        className="hidden lg:flex mt-8"
                    >
                        <Dock
                            items={[
                                { label: 'Khóa học', icon: BookOpen,  tone: 'from-sky-400 to-blue-600',      onClick: scrollToCourses, running: true },
                                { label: 'Lộ trình', icon: Waypoints, tone: 'from-violet-400 to-purple-600', onClick: () => navigate('/roadmap') },
                                { label: 'Bài viết', icon: Newspaper, tone: 'from-amber-300 to-orange-500',  onClick: () => navigate('/articles') },
                                { label: 'Đã lưu',   icon: Bookmark,  tone: 'from-rose-400 to-pink-600',     onClick: () => navigate('/saved') },
                                { label: 'Cá nhân',  icon: User,      tone: 'from-emerald-400 to-teal-600',  onClick: () => navigate('/personal') },
                                { label: 'Cài đặt',  icon: Settings,  tone: 'from-slate-300 to-slate-500',   onClick: () => navigate('/settings') },
                            ]}
                        />
                    </motion.div>
                </div>

                {/* ── Right: cửa sổ editor nổi (lg+) ── */}
                <div className="hidden lg:block relative">
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                    >
                        <EditorWindow index={index} onSelect={setIndex} lines={lines} file={slide.file} />
                    </motion.div>

                    {/* Thông báo macOS: streak — nổi nhẹ */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                        transition={{ opacity: { delay: 0.5, duration: 0.3 }, scale: { delay: 0.5, duration: 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
                        className="absolute -top-4 -right-3 z-10"
                    >
                        <MacNotification
                            icon={<Flame className="w-4 h-4" />}
                            tone="from-orange-400 to-rose-500"
                            title="EduHub"
                            body={streak === null ? 'Streak 7 ngày 🔥 — giữ nhịp nhé!' : streak > 0 ? `Streak ${streak} ngày 🔥 — giữ nhịp nhé!` : 'Học một bài hôm nay để bắt đầu streak'}
                        />
                    </motion.div>

                    {/* Thông báo macOS: tiến độ — xếp dưới thông báo streak như Notification Center */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, y: [0, 6, 0] }}
                        transition={{ opacity: { delay: 0.65, duration: 0.3 }, scale: { delay: 0.65, duration: 0.3 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
                        className="absolute top-[5.5rem] -right-3 z-10"
                    >
                        <MacNotification
                            icon={<CheckCircle2 className="w-4 h-4" />}
                            tone="from-emerald-400 to-teal-600"
                            title="Advanced React"
                            body="12/24 bài · còn 6 giờ"
                        >
                            <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-primary-200"
                                    initial={{ width: 0 }}
                                    animate={{ width: '50%' }}
                                    transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
                                />
                            </div>
                        </MacNotification>
                    </motion.div>
                </div>
            </div>
        </div>
        </motion.section>
    );
};

/* ── Menu bar macOS ─────────────────────────────────────────── */

const MENUS = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

const fmtClock = (d: Date) =>
    `${new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(d)}  ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

const MenuBar: React.FC<{ onSearch: () => void }> = ({ onSearch }) => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="relative flex items-center h-7 px-3 sm:px-4 gap-4 text-[12px] font-medium text-white/80 bg-ink-950/50 backdrop-blur-md border-b border-white/10 select-none">
            <span className="flex items-center gap-1.5 font-semibold text-white">
                <Code2 className="w-3.5 h-3.5 text-primary-300" /> EduHub
            </span>
            <nav aria-hidden className="hidden sm:flex items-center gap-4 text-white/60">
                {MENUS.map((m) => <span key={m} className="hover:text-white transition-colors">{m}</span>)}
            </nav>
            <div className="ml-auto flex items-center gap-3 text-white/60">
                <button onClick={onSearch} aria-label="Tìm kiếm (Ctrl K)" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-mono text-[10.5px]">⌘K</span>
                </button>
                <Wifi className="w-3.5 h-3.5" aria-hidden />
                <BatteryFull className="w-4 h-4" aria-hidden />
                <span className="tabular-nums text-white/80 whitespace-nowrap">{fmtClock(now)}</span>
            </div>
        </div>
    );
};

/* ── Cửa sổ editor ───────────────────────────────────────────── */

interface EditorWindowProps {
    index: number;
    onSelect: (i: number) => void;
    lines: React.ReactNode[];
    file: string;
}

const EditorWindow: React.FC<EditorWindowProps> = ({ index, onSelect, lines, file }) => {
    const last = lines.length - 1;

    return (
        <div className="relative rounded-xl overflow-hidden bg-[#0c1322]/85 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_0_0_1px_rgb(0_0_0/0.5),0_40px_80px_-24px_rgb(0_0_0/0.8)]">
            {/* Title bar */}
            <div className="relative flex items-center h-9 px-3.5 bg-white/[0.04] border-b border-white/[0.08]">
                <TrafficLights />
                <p className="absolute inset-x-24 text-center font-mono text-[11px] text-white/45 pointer-events-none truncate">{file} — eduhub</p>
                <PanelRight className="ml-auto w-3.5 h-3.5 text-white/30" aria-hidden />
            </div>

            {/* Tab strip */}
            <div role="tablist" aria-label="Slide" className="flex items-stretch h-8 bg-ink-950/40 border-b border-white/[0.08]">
                {slides.map((s, i) => {
                    const active = i === index;
                    return (
                        <button
                            key={s.file}
                            role="tab"
                            aria-selected={active}
                            aria-label={`Slide ${i + 1}: ${s.eyebrow}`}
                            onClick={() => onSelect(i)}
                            className={cn(
                                'relative flex items-center gap-2 px-3.5 font-mono text-[11px] whitespace-nowrap border-r border-white/[0.06] transition-colors',
                                active ? 'text-white bg-white/[0.06]' : 'text-white/45 hover:text-white/85 hover:bg-white/[0.03]',
                            )}
                        >
                            {active && (
                                <motion.span
                                    layoutId="hero-tab-indicator"
                                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-400"
                                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                />
                            )}
                            <span className="w-2 h-2 rounded-[3px] flex-shrink-0" style={{ background: s.dot }} aria-hidden />
                            {s.file}
                            {active && <span className="ml-0.5 text-white/40" aria-hidden>×</span>}
                        </button>
                    );
                })}
            </div>

            {/* Code + minimap */}
            <div className="relative overflow-hidden">
                <pre className="px-4 py-3 xl:pr-16 font-mono text-[11.5px] leading-[1.6] text-white/90 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35, ease: EASE }}
                        >
                            {lines.map((line, i) => (
                                <div key={i} className={cn('flex -mx-2 px-2 rounded-md', i === last && 'bg-white/[0.04]')}>
                                    <span className={cn('w-6 mr-4 text-right select-none', i === last ? 'text-white/50' : 'text-white/25')}>{i + 1}</span>
                                    <code className="whitespace-pre">
                                        {line}
                                        {i === last && <Caret />}
                                    </code>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </pre>

                {/* Minimap: bản thu nhỏ của chính đoạn code, chỉ trang trí */}
                <div aria-hidden className="hidden xl:block absolute top-0 right-0 bottom-0 w-12 border-l border-white/[0.06] bg-white/[0.015] overflow-hidden">
                    <div className="absolute top-2 left-1.5 w-[560px] origin-top-left scale-[0.2] font-mono text-[11.5px] leading-[1.6] whitespace-pre opacity-60">
                        {lines.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                    <div className="absolute inset-x-0 top-1.5 h-14 bg-white/[0.06]" />
                </div>
            </div>

            <TerminalPanel />

            {/* Status bar — màu brand như VS Code */}
            <div className="flex items-center gap-3 h-6 px-3 bg-primary-600/30 border-t border-white/[0.08] font-mono text-[10.5px] text-white/75 whitespace-nowrap overflow-hidden">
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> main</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-300" /> 0</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-300" /> 0</span>
                <span className="ml-auto tabular-nums">Ln {lines.length}, Col 2</span>
                <span>UTF-8</span>
                <span className="flex items-center gap-1"><Braces className="w-3 h-3" /> TypeScript</span>
                <span className="hidden xl:inline">Prettier ✓</span>
            </div>
        </div>
    );
};

/* ── Terminal zsh tích hợp — gõ lệnh rồi in kết quả ─────────── */

const CMD = 'npm run dev';
const OUTPUT: Array<{ text: string; className: string }> = [
    { text: '> eduhub@1.0.0 dev', className: 'text-white/45' },
    { text: 'Compiled successfully!', className: 'text-emerald-300' },
    { text: 'Local:  http://localhost:3000', className: 'text-white/70' },
];

const Prompt: React.FC = () => (
    <>
        <span className="text-emerald-300">➜</span>{' '}
        <span className="text-sky-300">eduhub</span>{' '}
        <span className="text-sky-200/60">git:(</span><span className="text-rose-300">main</span><span className="text-sky-200/60">)</span>{' '}
        <span className="text-amber-300">✗</span>{' '}
    </>
);

const TerminalPanel: React.FC = () => {
    // Gõ từng ký tự sau 1.4s; xong thì in output có stagger
    const [typed, setTyped] = useState(0);
    useEffect(() => {
        let tick: ReturnType<typeof setInterval> | undefined;
        const start = setTimeout(() => {
            let i = 0;
            tick = setInterval(() => {
                i += 1;
                setTyped(i);
                if (i >= CMD.length && tick) clearInterval(tick);
            }, 70);
        }, 1400);
        return () => { clearTimeout(start); if (tick) clearInterval(tick); };
    }, []);
    const done = typed >= CMD.length;

    return (
        <div className="border-t border-white/[0.08] bg-black/25">
            <div className="flex items-center gap-4 h-7 px-3.5 font-mono text-[10px] uppercase tracking-wider text-white/40 border-b border-white/[0.06]">
                <span className="flex items-center h-full text-white/80 border-b border-primary-300">Terminal</span>
                <span>Problems</span>
                <span>Output</span>
                <span className="ml-auto flex items-center gap-1.5 normal-case tracking-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> zsh
                </span>
            </div>
            <div className="h-[92px] px-3.5 py-2 font-mono text-[11.5px] leading-[1.6] overflow-hidden">
                <div>
                    <Prompt />
                    <span className="text-white/90">{CMD.slice(0, typed)}</span>
                    {!done && <Caret className="bg-white/80" />}
                </div>
                {done && OUTPUT.map((l, i) => (
                    <motion.div
                        key={l.text}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.22, duration: 0.25 }}
                        className={l.className}
                    >
                        {l.text}
                    </motion.div>
                ))}
                {done && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + OUTPUT.length * 0.22 }}>
                        <Prompt /><Caret className="bg-white/80" />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

/* ── Thông báo macOS ─────────────────────────────────────────── */

interface MacNotificationProps {
    icon: React.ReactNode;
    /** Gradient cho app icon, ví dụ "from-orange-400 to-rose-500" */
    tone: string;
    title: string;
    body: string;
    children?: React.ReactNode;
}

const MacNotification: React.FC<MacNotificationProps> = ({ icon, tone, title, body, children }) => (
    <div className="w-60 p-3 rounded-2xl bg-ink-950/60 border border-white/15 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]">
        <div className="flex items-start gap-3">
            <span className={cn('flex w-9 h-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br text-white shadow-md', tone)}>
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-semibold text-white truncate">{title}</p>
                    <span className="text-[10px] text-white/45 flex-shrink-0">bây giờ</span>
                </div>
                <p className="text-[12px] text-white/75 leading-snug">{body}</p>
            </div>
        </div>
        {children}
    </div>
);

/* ── Dock macOS — ô squircle kính, phóng to theo chuột, nảy khi click ── */

interface DockItemData {
    label: string;
    icon: LucideIcon;
    /** Gradient dọc của ô, ví dụ "from-sky-400 to-blue-600" (sáng trên, đậm dưới như icon macOS) */
    tone: string;
    onClick: () => void;
    /** Chấm "đang chạy" dưới icon */
    running?: boolean;
}

const Dock: React.FC<{ items: DockItemData[] }> = ({ items }) => {
    // Infinity = chuột không ở trên dock → mọi icon về kích thước gốc
    const mouseX = useMotionValue(Infinity);
    return (
        <div
            onMouseMove={(e) => mouseX.set(e.clientX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex items-end gap-2 h-[4.25rem] px-2.5 pb-2 rounded-[20px] bg-white/[0.14] border border-white/20 backdrop-blur-2xl shadow-[0_16px_40px_-16px_rgb(0_0_0/0.7),0_1px_0_rgb(255_255_255/0.15)_inset]"
        >
            {items.map((it) => <DockItem key={it.label} mouseX={mouseX} {...it} />)}
        </div>
    );
};

const DockItem: React.FC<DockItemData & { mouseX: MotionValue<number> }> = ({ mouseX, label, icon: Icon, tone, onClick, running }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const distance = useTransform(mouseX, (x) => {
        const r = ref.current?.getBoundingClientRect();
        return r ? x - r.x - r.width / 2 : Infinity;
    });
    const size = useSpring(useTransform(distance, [-140, 0, 140], [40, 64, 40]), { mass: 0.1, stiffness: 170, damping: 14 });
    // Nảy lên như app macOS đang khởi động
    const bounce = useAnimationControls();
    const handleClick = () => {
        bounce.start({ y: [0, -16, 0, -6, 0], transition: { duration: 0.6, ease: 'easeOut' } });
        onClick();
    };

    return (
        <motion.button
            ref={ref}
            style={{ width: size, height: size }}
            animate={bounce}
            onClick={handleClick}
            aria-label={label}
            className="group/dock relative flex items-center justify-center flex-shrink-0 text-white"
        >
            {/* Ô squircle: gradient dọc + highlight trên + viền tối mỏng + bóng */}
            <span
                aria-hidden
                className={cn(
                    'absolute inset-0 rounded-[22%] bg-gradient-to-b ring-1 ring-black/20',
                    'shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-1px_0_rgb(0_0_0/0.15),0_2px_6px_rgb(0_0_0/0.35)]',
                    tone,
                )}
            />
            <span aria-hidden className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/30 via-white/[0.06] to-transparent" />
            <Icon className="relative w-1/2 h-1/2 drop-shadow-[0_1px_1px_rgb(0_0_0/0.35)]" strokeWidth={2.25} />
            {/* Nhãn nổi lên trên khi hover, có mũi nhọn như tooltip của Dock */}
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-ink-950/85 border border-white/15 backdrop-blur-md font-medium text-[11px] text-white whitespace-nowrap opacity-0 group-hover/dock:opacity-100 transition-opacity after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink-950/85">
                {label}
            </span>
            {running && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" aria-hidden />}
        </motion.button>
    );
};

/* Token màu cho snippet — tô tay, không cần highlighter. */
type Tok = React.FC<{ children: React.ReactNode }>;
const K: Tok = ({ children }) => <span className="text-accent-300">{children}</span>;        // keyword
const F: Tok = ({ children }) => <span className="text-sky-300">{children}</span>;           // function
const T: Tok = ({ children }) => <span className="text-code-300">{children}</span>;          // type
const S: Tok = ({ children }) => <span className="text-emerald-300">{children}</span>;       // string
const N: Tok = ({ children }) => <span className="text-amber-300">{children}</span>;         // number
const C: Tok = ({ children }) => <span className="text-white/35 italic">{children}</span>;   // comment
const P: Tok = ({ children }) => <span className="text-white/55">{children}</span>;          // punctuation

/**
 * Mỗi slide một snippet, đúng 13 dòng để pane không đổi chiều cao khi chuyển tab.
 * Thứ tự khớp với `slides` trong mockCourses.
 */
const SNIPPETS: React.ReactNode[][] = [
    // react.tsx — custom hook
    [
        <C>{'// react.tsx — custom hook'}</C>,
        <><K>import</K> <P>{'{'}</P> useState <P>{'}'}</P> <K>from</K> <S>"react"</S><P>;</P></>,
        <></>,
        <><K>export function</K> <F>useProgress</F><P>(</P>total<P>:</P> <T>number</T><P>) {'{'}</P></>,
        <>  <K>const</K> <P>[</P>done<P>,</P> setDone<P>] =</P> <F>useState</F><P>(</P><N>12</N><P>);</P></>,
        <>  <K>const</K> percent <P>=</P> Math<P>.</P><F>round</F><P>((</P>done <P>/</P> total<P>) *</P> <N>100</N><P>);</P></>,
        <></>,
        <>  <K>return</K> <P>{'{'}</P></>,
        <>    percent<P>,</P></>,
        <>    <F>complete</F><P>: () =&gt;</P> <F>setDone</F><P>((</P>d<P>) =&gt;</P> d <P>+</P> <N>1</N><P>),</P></>,
        // eslint-disable-next-line no-template-curly-in-string -- chuỗi hiển thị trang trí, không phải template
        <>    label<P>:</P> <S>{'`Đã học ${done}/${total} bài 🚀`'}</S><P>,</P></>,
        <>  <P>{'};'}</P></>,
        <><P>{'}'}</P></>,
    ],
    // typescript.ts — Result<T>
    [
        <C>{'// typescript.ts — Result<T>'}</C>,
        <><K>export type</K> <T>Result</T><P>&lt;</P><T>T</T><P>,</P> <T>E</T> <P>=</P> <T>Error</T><P>&gt; =</P></>,
        <>  <P>|</P> <P>{'{'}</P> ok<P>:</P> <N>true</N><P>;</P> value<P>:</P> <T>T</T> <P>{'}'}</P></>,
        <>  <P>|</P> <P>{'{'}</P> ok<P>:</P> <N>false</N><P>;</P> error<P>:</P> <T>E</T> <P>{'}'};</P></>,
        <></>,
        <><K>export async function</K> <F>safe</F><P>&lt;</P><T>T</T><P>&gt;(</P>p<P>:</P> <T>Promise</T><P>&lt;</P><T>T</T><P>&gt;) {'{'}</P></>,
        <>  <K>try</K> <P>{'{'}</P></>,
        <>    <K>return</K> <P>{'{'}</P> ok<P>:</P> <N>true</N><P>,</P> value<P>:</P> <K>await</K> p <P>{'}'};</P></>,
        <>  <P>{'}'}</P> <K>catch</K> <P>(</P>e<P>) {'{'}</P></>,
        <>    <K>return</K> <P>{'{'}</P> ok<P>:</P> <N>false</N><P>,</P> error<P>:</P> e <K>as</K> <T>Error</T> <P>{'}'};</P></>,
        <>  <P>{'}'}</P></>,
        <><P>{'}'}</P></>,
        <><K>const</K> user <P>=</P> <K>await</K> <F>safe</F><P>(</P><F>fetchUser</F><P>(</P><N>1</N><P>));</P></>,
    ],
    // fullstack.ts — API route
    [
        <C>{'// fullstack.ts — API route'}</C>,
        <><K>import</K> <P>{'{'}</P> Hono <P>{'}'}</P> <K>from</K> <S>"hono"</S><P>;</P></>,
        <><K>import</K> <P>{'{'}</P> db <P>{'}'}</P> <K>from</K> <S>"./db"</S><P>;</P></>,
        <></>,
        <><K>const</K> app <P>=</P> <K>new</K> <F>Hono</F><P>();</P></>,
        <></>,
        <>app<P>.</P><F>get</F><P>(</P><S>"/courses/:id"</S><P>,</P> <K>async</K> <P>(</P>c<P>) =&gt; {'{'}</P></>,
        <>  <K>const</K> id <P>=</P> <F>Number</F><P>(</P>c<P>.</P>req<P>.</P><F>param</F><P>(</P><S>"id"</S><P>));</P></>,
        <>  <K>const</K> course <P>=</P> <K>await</K> db<P>.</P>course<P>.</P><F>find</F><P>(</P>id<P>);</P></>,
        <>  <K>if</K> <P>(!</P>course<P>)</P> <K>return</K> c<P>.</P><F>notFound</F><P>();</P></>,
        <>  <K>return</K> c<P>.</P><F>json</F><P>(</P>course<P>);</P></>,
        <><P>{'});'}</P></>,
        <><K>export default</K> app<P>;</P></>,
    ],
];

/* ─────────────────────────────────────────────────────────────
   Stats — cửa sổ terminal, số đếm lên khi cuộn tới (NumberFlow)
   ───────────────────────────────────────────────────────────── */

interface Stat {
    icon: typeof Users;
    /** Nhãn dạng identifier, hiện trong panel như tên biến */
    key: string;
    label: string;
    value: number;
    suffix?: string;
    format?: Intl.NumberFormatOptions;
}

/** Số ≥ 1000 → "12K+", dưới đó hiện chính xác (không "+" cho số nhỏ). */
const bigNumber = (n: number): Pick<Stat, 'value' | 'suffix' | 'format'> =>
    n >= 1000
        ? { value: n, suffix: '+', format: { notation: 'compact', maximumFractionDigits: 1 } }
        : { value: n };

/** Dựng 4 ô từ số liệu thật; khi chưa có review thì ô rating đổi thành số bài học. */
const buildStats = (s: PublicStats): Stat[] => [
    { icon: Users,    key: 'learners', label: 'Học viên', ...bigNumber(s.learners) },
    { icon: BookOpen, key: 'courses',  label: 'Khóa học', ...bigNumber(s.activeCourses) },
    s.averageRating > 0
        ? { icon: Star,     key: 'rating',  label: 'Đánh giá trung bình', value: s.averageRating, format: { minimumFractionDigits: 1, maximumFractionDigits: 1 } }
        : { icon: BookOpen, key: 'lessons', label: 'Bài học', ...bigNumber(s.lessons) },
    { icon: Trophy,   key: 'completion', label: 'Tỉ lệ hoàn thành', value: s.completionRate, suffix: '%', format: { maximumFractionDigits: 0 } },
];

const formatTime = (iso: string): string | null => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const Stats: React.FC = () => {
    const { data } = usePublicStats();
    // Production không có số liệu → ẩn khối này thay vì hiện số giả
    if (!data) return null;
    return <StatsGrid stats={buildStats(data)} updatedAt={formatTime(data.computedAt)} />;
};

/**
 * Tách riêng để useInView gắn observer đúng lúc element mount — nếu gọi useInView ở Stats
 * (lúc còn chờ API và return null) thì ref rỗng, observer không bao giờ gắn, khối ẩn mãi.
 */
const StatsGrid: React.FC<{ stats: Stat[]; updatedAt: string | null }> = ({ stats: STATS, updatedAt }) => {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.section
            ref={ref}
            className="mb-8"
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
        >
            <MacWindow
                title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> stats — zsh</>}
                footer={
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        live{updatedAt && <span className="hidden sm:inline text-fg-subtle">· cập nhật {updatedAt}</span>}
                        <span className="ml-auto">UTF-8</span>
                    </>
                }
            >
            {/* Dòng lệnh đầu tiên trong terminal */}
            <div className="flex items-center gap-1.5 px-4 h-9 border-b border-line font-mono text-[11.5px] whitespace-nowrap overflow-hidden">
                <span className="text-emerald-500">➜</span>
                <span className="text-sky-600 dark:text-sky-300">~</span>
                <span className="text-fg-2">eduhub stats</span>
                <span className="text-primary-600 dark:text-primary-300">--public</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
                {STATS.map((stat) => (
                    <motion.div
                        key={stat.key}
                        variants={{
                            hidden: { opacity: 0, y: 18, scale: 0.97 },
                            show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
                        }}
                        className="group relative bg-surface p-5 transition-colors duration-300 hover:bg-surface-2/60"
                    >
                        {/* Vạch accent trượt ra khi hover */}
                        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                        <div className="flex items-center gap-2 font-mono text-[11px] text-fg-muted">
                            <span className="flex w-6 h-6 items-center justify-center rounded-md border border-line bg-surface text-primary-600 dark:text-primary-300 flex-shrink-0">
                                <stat.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                            </span>
                            <span className="truncate"><span className="text-fg-subtle select-none">{'// '}</span>{stat.key}</span>
                        </div>
                        <NumberFlow
                            value={inView ? stat.value : 0}
                            suffix={stat.suffix}
                            format={stat.format}
                            locales="en-US"
                            className="block mt-3 text-2xl sm:text-[1.85rem] font-extrabold tracking-tight text-fg leading-none tabular-nums"
                        />
                        <p className="text-xs text-fg-muted mt-1.5 truncate">{stat.label}</p>
                    </motion.div>
                ))}
            </div>
            </MacWindow>
        </motion.section>
    );
};

export default HomePage;
