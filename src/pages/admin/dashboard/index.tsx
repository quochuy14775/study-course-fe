import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck, SlidersHorizontal, CalendarRange, RefreshCw, Loader2, FlaskConical, AlertCircle, GitBranch, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import { TrafficLights } from '../../../components/ui/TrafficLights';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuCheckboxItem,
} from '../../../components/ui/DropdownMenu';
import { cn } from '../../../lib/cn';
import { container, card, SectionHeading, fmtInt } from './shared';
import { DashboardContext, type DashboardData } from './data';
import { useDashboardData } from './useDashboardData';
import KpiRow from './KpiRow';
import EnrollmentsCard from './EnrollmentsCard';
import RevenueCard from './RevenueCard';
import OpsInbox from './OpsInbox';
import LiveFeed from './LiveFeed';
import { PassRateCard, DropOffCard, HardQuestionsCard } from './QualityCards';
import { HeatmapCard, FunnelCard, TopCoursesCard, LevelCard } from './GrowthCards';
import { CertificatesCard, ArticlesCard } from './ContentCards';
import { RANGE_LABEL, type Range } from '../../../mockDatas/mockAdminDashboard';

/* ─────────────────────────────────────────────────────────────
   Sections có thể ẩn/hiện — lưu localStorage
   ───────────────────────────────────────────────────────────── */

type SectionId = 'ops' | 'quality' | 'growth' | 'content';
const SECTIONS: Array<{ id: SectionId; label: string }> = [
    { id: 'ops',     label: 'Vận hành' },
    { id: 'quality', label: 'Chất lượng học tập' },
    { id: 'growth',  label: 'Tăng trưởng' },
    { id: 'content', label: 'Nội dung' },
];
const STORAGE_KEY = 'admin-dashboard-sections';

const loadSections = (): Record<SectionId, boolean> => {
    const all: Record<SectionId, boolean> = { ops: true, quality: true, growth: true, content: true };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...all, ...JSON.parse(raw) } : all;
    } catch {
        return all;
    }
};

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
};

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const firstName = (user?.name || 'Admin').trim().split(' ').pop();

    const [range, setRange] = useState<Range>('30d');
    const [visible, setVisible] = useState<Record<SectionId, boolean>>(loadSections);
    const [liveBump, setLiveBump] = useState(0);
    const { data: fetched, loading, refreshing, error, refresh } = useDashboardData(range);

    // Giờ đồng bộ gần nhất — hiện trên status line
    const [syncedAt, setSyncedAt] = useState<Date | null>(null);
    useEffect(() => { if (fetched) setSyncedAt(new Date()); }, [fetched]);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visible)); } catch { /* ignore */ }
    }, [visible]);

    // Ghi danh mới từ live feed → KPI "Ghi danh" nhảy theo
    useEffect(() => { setLiveBump(0); }, [fetched]);
    const onEnroll = useCallback(() => setLiveBump((n) => n + 1), []);

    const data = useMemo<DashboardData | null>(() => {
        if (!fetched) return null;
        if (liveBump === 0) return fetched;
        return {
            ...fetched,
            kpis: fetched.kpis.map((k) => (k.id === 'enrollments' ? { ...k, value: k.value + liveBump } : k)),
        };
    }, [fetched, liveBump]);

    const todo = data ? data.actionItems.length + data.openQuestions.length + data.lowReviews.length : 0;
    const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const visibleCount = SECTIONS.filter((s) => visible[s.id]).length;

    return (
        <main className="relative min-h-screen overflow-hidden">
            {/* Nền: mesh chuyển động chậm + grid + 2 blob — cùng ngôn ngữ với PersonalPage, dịu hơn */}
            <motion.div
                className="absolute inset-0 bg-gradient-mesh pointer-events-none"
                style={{ backgroundSize: '180% 180%' }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 24, ease: 'easeInOut', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]" />
            <motion.div
                className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-primary-400/15 dark:bg-primary-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent-400/12 dark:bg-accent-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
                transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
            />

            <div className="relative max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* ── Header: một cửa sổ terminal macOS — title bar, prompt zsh, "output" là greeting + toolbar, footer là status line ── */}
                <motion.div variants={container} initial="hidden" animate="show" className="mb-6 rounded-2xl border border-line bg-surface/80 backdrop-blur-md shadow-soft-lg overflow-hidden">
                    {/* Title bar */}
                    <motion.div variants={card} className="relative flex items-center h-9 px-4 border-b border-line bg-surface-2/60">
                        <TrafficLights />
                        <p className="absolute inset-x-24 text-center font-mono text-[11px] text-fg-muted truncate pointer-events-none">admin — zsh — ~/dashboard</p>
                        <span className="ml-auto font-mono text-[10px] text-fg-subtle tabular-nums">{RANGES.length}×{SECTIONS.length}</span>
                    </motion.div>

                    <div className="px-5 pt-4 pb-5">
                    {/* Prompt zsh: ➜ ~/dashboard git:(main) ✗ eduhub stats --range 30d */}
                    <motion.div variants={card} className="flex flex-wrap items-center gap-x-1.5 font-mono text-xs mb-3">
                        <span className="text-emerald-500">➜</span>
                        <span className="text-sky-600 dark:text-sky-300">~/dashboard</span>
                        <span className="text-fg-subtle">git:(</span><span className="-mx-1.5 text-rose-500 dark:text-rose-300">main</span><span className="text-fg-subtle">)</span>
                        <span className="text-amber-500">✗</span>
                        <span className="text-fg-2">eduhub stats</span>
                        <span className="text-primary-600 dark:text-primary-300">--range {range}</span>
                        <span className="ml-0.5 inline-block w-[7px] h-3.5 bg-primary-600 dark:bg-primary-300 animate-blink" />
                    </motion.div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <motion.div variants={card}>
                            <motion.h1
                                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                                style={{ backgroundSize: '200% auto' }}
                                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                                transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
                            >
                                {greeting()}, {firstName}
                            </motion.h1>
                            <p className="text-sm text-fg-muted mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                <span className="capitalize">{today}</span>
                                <span className="text-fg-subtle">·</span>
                                {/* Cặp key=value kiểu flag CLI */}
                                <Flag k="todo" v={fmtInt(todo)} accent={todo > 0} />
                                <Flag k="--range" v={range} />
                                {data?.source === 'mock' && (
                                    <Tooltip content="Backend không phản hồi — đang hiển thị dữ liệu mẫu (chỉ ở development)" side="bottom">
                                        <span className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 font-mono text-[11px] font-medium">
                                            <FlaskConical className="w-3 h-3" /> --mock
                                        </span>
                                    </Tooltip>
                                )}
                            </p>
                        </motion.div>

                        <motion.div variants={card} className="flex flex-wrap items-center gap-2">
                            <RangeFilter value={range} onChange={setRange} />

                            <Tooltip content="Tải lại số liệu" side="bottom">
                                <Button variant="secondary" size="icon" aria-label="Tải lại" className="h-10 w-10" onClick={refresh} disabled={loading || refreshing}>
                                    <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                                </Button>
                            </Tooltip>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" aria-label="Tùy chỉnh dashboard" className="h-10 w-10">
                                        <SlidersHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Hiển thị nhóm</DropdownMenuLabel>
                                    {SECTIONS.map((s) => (
                                        <DropdownMenuCheckboxItem
                                            key={s.id}
                                            checked={visible[s.id]}
                                            onCheckedChange={(v) => setVisible((cur) => ({ ...cur, [s.id]: !!v }))}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {s.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="secondary" onClick={() => navigate('/management/certificates')} className="hidden sm:inline-flex">
                                <ShieldCheck className="w-4 h-4" /> Xác minh
                            </Button>
                            <Button onClick={() => navigate('/management')}>
                                <Plus className="w-4 h-4" /> Tạo khóa học
                            </Button>
                        </motion.div>
                    </div>

                    </div>

                    {/* Footer — thanh trạng thái như VS Code, tint màu brand */}
                    <motion.div
                        variants={card}
                        className="flex items-center gap-4 h-8 px-4 border-t border-line bg-primary-600/10 dark:bg-primary-500/15 font-mono text-[11px] text-fg-muted whitespace-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> main</span>
                        <span className="flex items-center gap-1.5">
                            <span className={cn('w-1.5 h-1.5 rounded-full', data?.source === 'api' ? 'bg-emerald-500 animate-pulse' : data?.source === 'mock' ? 'bg-amber-500' : 'bg-fg-subtle')} />
                            {data?.source === 'api' ? 'api: connected' : data?.source === 'mock' ? 'api: mock' : 'api: …'}
                        </span>
                        <span className="flex items-center gap-1.5"><LayoutGrid className="w-3 h-3" /> sections {visibleCount}/{SECTIONS.length}</span>
                        <span className="ml-auto flex items-center gap-1.5 tabular-nums">
                            {refreshing ? <><Loader2 className="w-3 h-3 animate-spin" /> syncing…</> : syncedAt ? `synced ${syncedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'synced —'}
                        </span>
                        <span className="hidden sm:inline">UTF-8</span>
                        <span className="hidden sm:inline text-primary-600 dark:text-primary-300">dashboard.tsx</span>
                    </motion.div>
                </motion.div>

                {/* ── Trạng thái tải ── */}
                {loading && (
                    <div className="flex items-center justify-center gap-3 py-24 font-mono text-sm text-fg-muted">
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                        <span><span className="text-code-600 dark:text-code-400">$</span> fetch dashboard --range {range}<span className="animate-blink">_</span></span>
                    </div>
                )}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                        <span className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </span>
                        <p className="text-sm font-medium text-fg-2">{error}</p>
                        <Button variant="secondary" size="sm" onClick={refresh}><RefreshCw className="w-3.5 h-3.5" /> Thử lại</Button>
                    </div>
                )}

                {data && (
                <DashboardContext.Provider value={data}>
                {/* Tải lại (đổi range): giữ render cũ, mờ đi thay vì nháy skeleton */}
                <div className={cn('space-y-5 transition-opacity duration-300', refreshing && 'opacity-60 pointer-events-none')}>
                    <KpiRow />

                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        <div className={cn('min-w-0', data.revenueMonthly ? 'xl:col-span-8' : 'xl:col-span-12')}>
                            <EnrollmentsCard liveBump={liveBump} />
                        </div>
                        {data.revenueMonthly && <div className="xl:col-span-4 min-w-0"><RevenueCard /></div>}
                    </motion.div>

                    {/* ── Vận hành ── */}
                    <Section show={visible.ops}>
                        <SectionHeading eyebrow="Vận hành" title="Việc cần bạn phản hồi" hint="Xử lý tại chỗ, không cần rời trang" />
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                            <div className="xl:col-span-8 min-w-0"><OpsInbox /></div>
                            <div className="xl:col-span-4 min-w-0"><LiveFeed onEnroll={onEnroll} /></div>
                        </div>
                    </Section>

                    {/* ── Chất lượng học tập ── */}
                    <Section show={visible.quality}>
                        <SectionHeading eyebrow="Chất lượng học tập" title="Học viên đang mắc ở đâu" hint="Tín hiệu để sửa nội dung trước khi review xấu xuất hiện" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            <PassRateCard />
                            <DropOffCard />
                            <div className="md:col-span-2 xl:col-span-1"><HardQuestionsCard /></div>
                        </div>
                    </Section>

                    {/* ── Tăng trưởng ── */}
                    <Section show={visible.growth}>
                        <SectionHeading eyebrow="Tăng trưởng" title="Chuyển đổi và thói quen học" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
                            <div className="md:col-span-2 xl:col-span-5 min-w-0"><HeatmapCard /></div>
                            <div className="xl:col-span-3 min-w-0"><FunnelCard /></div>
                            <div className="xl:col-span-4 min-w-0"><TopCoursesCard /></div>
                        </div>
                    </Section>

                    {/* ── Nội dung ── */}
                    <Section show={visible.content}>
                        <SectionHeading eyebrow="Nội dung" title="Khóa học, chứng chỉ, bài viết" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            <LevelCard />
                            <CertificatesCard />
                            <div className="md:col-span-2 xl:col-span-1"><ArticlesCard /></div>
                        </div>
                    </Section>
                </div>
                </DashboardContext.Provider>
                )}
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

/** Cặp key=value mono cho dòng meta, ví dụ `todo=13`, `--range=30d`. */
const Flag: React.FC<{ k: string; v: string; accent?: boolean }> = ({ k, v, accent }) => (
    <span className="inline-flex items-center h-6 px-1.5 rounded-md border border-line bg-surface font-mono text-[11px] text-fg-muted">
        {k}<span className="text-fg-subtle">=</span>
        <span className={cn('font-semibold', accent ? 'text-primary-600 dark:text-primary-300' : 'text-fg-2')}>{v}</span>
    </span>
);

const RANGES: Range[] = ['7d', '30d', '90d'];

const RangeFilter: React.FC<{ value: Range; onChange: (r: Range) => void }> = ({ value, onChange }) => (
    <div className="inline-flex items-center h-10 rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist" aria-label="Khoảng thời gian">
        <span className="pl-2 pr-1.5 text-fg-subtle"><CalendarRange className="w-4 h-4" /></span>
        {RANGES.map((r) => {
            const active = r === value;
            return (
                <button
                    key={r}
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChange(r)}
                    aria-label={RANGE_LABEL[r]}
                    title={RANGE_LABEL[r]}
                    className={cn('relative px-3 h-8 rounded-lg font-mono text-xs font-semibold transition-colors', active ? 'text-white' : 'text-fg-muted hover:text-fg')}
                >
                    {active && (
                        <motion.span
                            layoutId="range-pill"
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 shadow-glow-primary"
                            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                        />
                    )}
                    <span className="relative">{r}</span>
                </button>
            );
        })}
    </div>
);

/** Nhóm card: stagger khi cuộn tới; ẩn/hiện có animation chiều cao. */
const Section: React.FC<{ show: boolean; children: React.ReactNode }> = ({ show, children }) => {
    // Chỉ clip trong lúc đang đổi chiều cao — để card lift/shadow không bị cắt lúc bình thường
    const [animating, setAnimating] = useState(false);
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.section
                    key="s"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onAnimationStart={() => setAnimating(true)}
                    onAnimationComplete={() => setAnimating(false)}
                    className={cn(animating && 'overflow-hidden')}
                >
                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-60px' }}
                        className="pt-1"
                    >
                        {children}
                    </motion.div>
                </motion.section>
            )}
        </AnimatePresence>
    );
};

export default AdminDashboard;
