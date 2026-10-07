import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Clock, CheckCircle2, Flame, Award, Search, ArrowRight, Play, Terminal, FolderOpen,
    LayoutGrid, Loader, type LucideIcon,
} from 'lucide-react';
import { useMyCoursesState } from '../../../hooks/useMyCourses';
import { MacWindow } from '../../../components/ui/MacWindow';
import { PageTitle } from '../../../components/ui/PageTitle';
import { TermCommand, TermBar, TermStatGrid, type TermStatItem } from '../../../components/ui/Terminal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDurationSeconds } from '../../../types/course';
import type { EnrolledCourse } from '../../../types/enrollment';
import { THUMBNAIL_GRADIENTS } from './CourseCard';
import { cn } from '../../../lib/cn';

type Filter = 'all' | 'inprogress' | 'completed';

const FILTERS: Array<{ id: Filter; label: string; icon: LucideIcon }> = [
    { id: 'all',        label: 'Tất cả',     icon: LayoutGrid },
    { id: 'inprogress', label: 'Đang học',   icon: Loader },
    { id: 'completed',  label: 'Hoàn thành', icon: CheckCircle2 },
];

const LEVEL: Record<string, { label: string; badge: 'success' | 'warning' | 'primary' }> = {
    Beginner:     { label: 'Cơ bản',    badge: 'success' },
    Intermediate: { label: 'Trung cấp', badge: 'warning' },
    Advanced:     { label: 'Nâng cao',  badge: 'primary' },
};

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

const MyCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: enrollments, loading } = useMyCoursesState();
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');

    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => enrollments.filter((e) =>
        (filter === 'all' || (filter === 'completed') === e.isCompleted) &&
        (!q || e.course.title.toLowerCase().includes(q)),
    ), [enrollments, filter, q]);

    const stats = useMemo(() => ({
        total:      enrollments.length,
        inprogress: enrollments.filter((e) => !e.isCompleted).length,
        completed:  enrollments.filter((e) => e.isCompleted).length,
        seconds:    enrollments.reduce((s, e) => s + e.course.totalDurationSeconds, 0),
    }), [enrollments]);

    const tiles: TermStatItem[] = [
        { icon: BookOpen,     k: 'enrolled',    label: 'Đã ghi danh', value: stats.total },
        { icon: Flame,        k: 'in_progress', label: 'Đang học',    value: stats.inprogress },
        { icon: CheckCircle2, k: 'completed',   label: 'Hoàn thành',  value: stats.completed },
        { icon: Clock,        k: 'total_time',  label: 'Tổng thời lượng', value: stats.seconds > 0 ? formatDurationSeconds(stats.seconds) : '0m' },
    ];
    const current = FILTERS.find((f) => f.id === filter)!;
    const countOf = (id: Filter) => id === 'all' ? stats.total : id === 'completed' ? stats.completed : stats.inprogress;

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                <PageTitle path="my-courses" title="Khóa học của tôi" subtitle="Tiếp tục hành trình học tập của bạn" />

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                    <MacWindow
                        title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> courses — zsh</>}
                        footer={<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live<span className="ml-auto">UTF-8</span></>}
                    >
                        <TermCommand cmd="eduhub courses" flags="--mine --stats" />
                        <TermStatGrid items={tiles} />
                    </MacWindow>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: EASE }}>
                    <MacWindow
                        title={<><FolderOpen className="w-3.5 h-3.5 text-primary-500" /> Khóa học của tôi</>}
                        footer={
                            <>
                                <span className="tabular-nums">{filtered.length} khóa học</span>
                                <span className="text-fg-subtle">·</span>
                                {stats.completed}/{stats.total} hoàn thành
                                <span className="ml-auto text-fg-subtle">~/my-courses/{filter}</span>
                            </>
                        }
                    >
                        <div className="flex min-h-[24rem]">
                            <aside className="hidden md:flex w-44 flex-shrink-0 flex-col gap-0.5 p-3 border-r border-line bg-surface-2/40">
                                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Trạng thái</p>
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        aria-pressed={filter === f.id}
                                        className={cn('relative flex items-center gap-2 h-8 px-2 rounded-md text-[12.5px] text-left transition-colors',
                                            filter === f.id ? 'text-primary-700 dark:text-primary-200 font-medium' : 'text-fg-2 hover:bg-surface-2')}
                                    >
                                        {filter === f.id && <motion.span layoutId="mycourses-side-active" className="absolute inset-0 rounded-md bg-primary-500/15" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                                        <f.icon className="relative w-3.5 h-3.5" />
                                        <span className="relative flex-1 truncate">{f.label}</span>
                                        <span className="relative font-mono text-[10.5px] text-fg-subtle tabular-nums">{countOf(f.id)}</span>
                                    </button>
                                ))}
                            </aside>

                            <div className="min-w-0 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 px-3 sm:px-4 h-11 border-b border-line">
                                    <span className="text-sm font-semibold text-fg truncate">{current.label}</span>
                                    <span className="font-mono text-[11px] text-fg-subtle tabular-nums whitespace-nowrap">{filtered.length} mục</span>
                                    <label className="relative ml-auto">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle pointer-events-none" />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Tìm khóa học…"
                                            aria-label="Tìm khóa học"
                                            className="h-7 w-28 sm:w-40 focus:w-40 sm:focus:w-56 pl-7 pr-2 rounded-md border border-line bg-surface font-mono text-[11.5px] text-fg placeholder:text-fg-subtle outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-[width,border-color,box-shadow] duration-300"
                                        />
                                    </label>
                                </div>

                                <div className="md:hidden flex gap-1.5 px-3 py-2 border-b border-line overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {FILTERS.map((f) => (
                                        <button key={f.id} onClick={() => setFilter(f.id)}
                                            className={cn('flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] whitespace-nowrap transition-colors',
                                                filter === f.id ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line text-fg-muted')}>
                                            <f.icon className="w-3.5 h-3.5" /> {f.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Header cột kiểu Finder list view */}
                                <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_9rem_auto] items-center gap-3 px-3 sm:px-4 h-8 border-b border-line bg-surface-2/60 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                                    <span />
                                    <span>Tên</span>
                                    <span className="hidden sm:inline">Tiến độ</span>
                                    <span className="text-right">Hành động</span>
                                </div>

                                <div className="flex-1">
                                    {loading ? (
                                        <div className="p-3 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}</div>
                                    ) : filtered.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-subtle mb-3"><BookOpen className="w-5 h-5" /></div>
                                            <p className="text-sm font-medium text-fg-2">
                                                {q ? 'Không có khóa nào khớp' : filter === 'completed' ? 'Chưa hoàn thành khóa nào' : filter === 'inprogress' ? 'Không có khóa đang học' : 'Bạn chưa ghi danh khóa nào'}
                                            </p>
                                            <p className="font-mono text-[11px] text-fg-subtle mt-1">{q ? <>{'// '}thử từ khóa khác</> : <>{'// '}chọn một khóa ở trang chủ để bắt đầu</>}</p>
                                            {!q && stats.total === 0 && (
                                                <Button size="sm" className="mt-4" onClick={() => navigate('/')}>Khám phá khóa học <ArrowRight className="w-3.5 h-3.5" /></Button>
                                            )}
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-line-2">
                                            {filtered.map((e) => <CourseRow key={e.courseId} enrollment={e} onOpen={() => navigate(`/courses/${e.courseId}`)} onLearn={() => navigate(`/courses/${e.courseId}/learn`)} />)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </MacWindow>
                </motion.div>
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Dòng khóa học — tiến độ dạng bar terminal, hành động theo trạng thái
   ───────────────────────────────────────────────────────────── */

const CourseRow: React.FC<{ enrollment: EnrolledCourse; onOpen: () => void; onLearn: () => void }> = ({ enrollment: e, onOpen, onLearn }) => {
    const c = e.course;
    const progress = Math.round(e.progress);
    const lvl = LEVEL[c.level] ?? LEVEL.Beginner;
    const gradient = THUMBNAIL_GRADIENTS[c.id % THUMBNAIL_GRADIENTS.length];

    return (
        <li onClick={onOpen} className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_9rem_auto] items-center gap-3 px-3 sm:px-4 h-16 cursor-pointer transition-colors hover:bg-primary-500/[0.05]">
            <span className={cn('relative flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br text-white font-mono font-bold', gradient)}>
                {c.title.charAt(0)}
                {e.isCompleted && <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white ring-2 ring-surface flex items-center justify-center"><CheckCircle2 className="w-2.5 h-2.5" /></span>}
            </span>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{c.title}</p>
                <p className="flex items-center gap-2 font-mono text-[11px] text-fg-muted truncate">
                    <Badge variant={lvl.badge} size="sm" className="normal-case tracking-normal">{lvl.label}</Badge>
                    {c.lessonCount > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.lessonCount} bài</span>}
                    {c.totalDurationSeconds > 0 && <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" />{formatDurationSeconds(c.totalDurationSeconds)}</span>}
                    {/* Tiến độ trên màn hẹp (cột riêng bị ẩn) */}
                    <span className="sm:hidden tabular-nums">{progress}%</span>
                </p>
            </div>
            <span className="hidden sm:flex items-center gap-2 whitespace-nowrap">
                <TermBar percent={progress} width={10} tone={e.isCompleted ? 'emerald' : 'primary'} />
                <span className="w-9 text-right font-mono text-[11px] text-fg tabular-nums">{progress}%</span>
            </span>
            <Button
                size="xs"
                variant={e.isCompleted ? 'secondary' : progress > 0 ? 'primary' : 'soft'}
                onClick={(ev) => { ev.stopPropagation(); onLearn(); }}
            >
                {e.isCompleted ? <><Award className="w-3 h-3" /> Xem lại</> : <><Play className="w-3 h-3 fill-current" /> {progress > 0 ? 'Tiếp tục' : 'Bắt đầu'}</>}
            </Button>
        </li>
    );
};

export default MyCoursesPage;
