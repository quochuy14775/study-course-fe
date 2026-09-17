import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid, List, Zap, Crown, Sparkles, Search, ChevronLeft, ChevronRight, FolderOpen, Inbox, ArrowRight,
    type LucideIcon,
} from 'lucide-react';
import CourseCard, { THUMBNAIL_GRADIENTS } from './CourseCard';
import { MacWindow } from '../../../components/ui/MacWindow';
import { Badge } from '../../../components/ui/Badge';
import { Course, CourseLevelLabel, formatDurationSeconds } from '../../../types/course';
import { cn } from '../../../lib/cn';

/* ─────────────────────────────────────────────────────────────
   CourseFinder — cửa sổ Finder: sidebar lọc, tìm kiếm, grid/list,
   nhóm theo loại, status bar. Thay cho 2 CourseSection rời.
   ───────────────────────────────────────────────────────────── */

type Filter = 'all' | 'free' | 'pro' | 'new';
type View = 'grid' | 'list';
type Variant = 'free' | 'pro';

interface Item { course: Course; variant: Variant }
interface Group { id: string; title: string; variant: Variant | 'mixed'; items: Item[] }

const FILTERS: Array<{ id: Filter; label: string; icon: LucideIcon }> = [
    { id: 'all',  label: 'Tất cả khóa học', icon: LayoutGrid },
    { id: 'free', label: 'Miễn phí',        icon: Zap },
    { id: 'pro',  label: 'Cao cấp',         icon: Crown },
    { id: 'new',  label: 'Mới nhất',        icon: Sparkles },
];

const LEVELS: Array<{ id: CourseLevelLabel; label: string; dot: string; badge: 'success' | 'warning' | 'primary' }> = [
    { id: 'Beginner',     label: 'Cơ bản',    dot: 'bg-emerald-500', badge: 'success' },
    { id: 'Intermediate', label: 'Trung cấp', dot: 'bg-amber-500',   badge: 'warning' },
    { id: 'Advanced',     label: 'Nâng cao',  dot: 'bg-violet-500',  badge: 'primary' },
];

const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const EASE = [0.16, 1, 0.3, 1] as const;

interface CourseFinderProps {
    free: Course[];
    pro: Course[];
    loading?: boolean;
    id?: string;
}

const CourseFinder: React.FC<CourseFinderProps> = ({ free, pro, loading = false, id }) => {
    const [filter, setFilter] = useState<Filter>('all');
    const [level, setLevel] = useState<CourseLevelLabel | null>(null);
    const [view, setView] = useState<View>('grid');
    const [query, setQuery] = useState('');

    const groups = useMemo<Group[]>(() => {
        const q = query.trim().toLowerCase();
        const ok = (c: Course) =>
            (!level || c.level === level) &&
            (!q || c.title.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q));
        const freeItems: Item[] = free.filter(ok).map((course) => ({ course, variant: 'free' }));
        const proItems:  Item[] = pro.filter(ok).map((course) => ({ course, variant: 'pro' }));

        switch (filter) {
            case 'free': return [{ id: 'free', title: 'Miễn phí', variant: 'free', items: freeItems }];
            case 'pro':  return [{ id: 'pro',  title: 'Cao cấp',  variant: 'pro',  items: proItems }];
            case 'new': {
                const items = [...freeItems, ...proItems].sort(
                    (a, b) => new Date(b.course.createdAt).getTime() - new Date(a.course.createdAt).getTime(),
                );
                return [{ id: 'new', title: 'Mới nhất', variant: 'mixed', items }];
            }
            default:
                return [
                    { id: 'free', title: 'Miễn phí', variant: 'free' as const, items: freeItems },
                    { id: 'pro',  title: 'Cao cấp',  variant: 'pro'  as const, items: proItems },
                ].filter((g) => g.items.length > 0);
        }
    }, [free, pro, filter, level, query]);

    const visible = groups.flatMap((g) => g.items);
    const total = { courses: visible.length, lessons: 0, seconds: 0 };
    for (const { course } of visible) {
        total.lessons += course.lessonCount;
        total.seconds += course.totalDurationSeconds;
    }
    const current = FILTERS.find((f) => f.id === filter)!;
    const contentKey = `${filter}-${level ?? 'any'}-${view}-${query.trim()}`;

    return (
        <motion.div
            id={id}
            className="scroll-mt-24 mb-14"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            <MacWindow
                title={<><FolderOpen className="w-3.5 h-3.5 text-primary-500" /> Khóa học</>}
                footer={
                    <>
                        <span className="tabular-nums">
                            {total.courses} khóa học · {total.lessons} bài học · {formatDurationSeconds(total.seconds)}
                        </span>
                        <span className="ml-auto text-fg-subtle">~/courses/{filter}{level ? `?level=${level.toLowerCase()}` : ''}</span>
                    </>
                }
            >
                <div className="flex min-h-[24rem]">
                    {/* ── Sidebar (md+) ── */}
                    <aside className="hidden md:flex w-44 flex-shrink-0 flex-col gap-5 p-3 border-r border-line bg-surface-2/40">
                        <SideGroup label="Yêu thích">
                            {FILTERS.map((f) => (
                                <SideItem key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                                    <f.icon className="w-3.5 h-3.5" />
                                    {f.label}
                                </SideItem>
                            ))}
                        </SideGroup>
                        <SideGroup label="Cấp độ">
                            {LEVELS.map((l) => (
                                <SideItem key={l.id} active={level === l.id} onClick={() => setLevel(level === l.id ? null : l.id)}>
                                    <span className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-surface', l.dot)} />
                                    {l.label}
                                </SideItem>
                            ))}
                        </SideGroup>
                    </aside>

                    {/* ── Content ── */}
                    <div className="min-w-0 flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 px-3 sm:px-4 h-11 border-b border-line">
                            <span className="hidden sm:flex items-center text-fg-subtle" aria-hidden>
                                <ChevronLeft className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-1" />
                            </span>
                            <span className="text-sm font-semibold text-fg truncate">{current.label}</span>
                            <span className="font-mono text-[11px] text-fg-subtle tabular-nums whitespace-nowrap">{total.courses} mục</span>

                            <div className="ml-auto flex items-center gap-2">
                                <ViewToggle view={view} onChange={setView} />
                                <label className="relative">
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
                        </div>

                        {/* Bộ lọc dạng chip trên màn hẹp (thay sidebar) */}
                        <div className="md:hidden flex gap-1.5 px-3 py-2 border-b border-line overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] whitespace-nowrap transition-colors',
                                        filter === f.id ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line text-fg-muted',
                                    )}
                                >
                                    <f.icon className="w-3.5 h-3.5" /> {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-3 sm:p-4">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : (
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={contentKey}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.18, ease: EASE }}
                                        className="space-y-6"
                                    >
                                        {visible.length === 0 ? (
                                            <EmptyState query={query} />
                                        ) : view === 'grid' ? (
                                            groups.map((g) => (
                                                <section key={g.id}>
                                                    <GroupHeader group={g} />
                                                    <motion.div
                                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                                                        variants={gridVariants}
                                                        initial="hidden"
                                                        whileInView="show"
                                                        viewport={{ once: true, margin: '-60px' }}
                                                    >
                                                        {g.items.map(({ course, variant }) => (
                                                            <CourseCard key={course.id} course={course} variant={variant} />
                                                        ))}
                                                    </motion.div>
                                                </section>
                                            ))
                                        ) : (
                                            <ListView groups={groups} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
            </MacWindow>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

const SideGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
        <div className="flex flex-col gap-0.5">{children}</div>
    </div>
);

const SideItem: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        aria-pressed={active}
        className={cn(
            'relative flex items-center gap-2 h-8 px-2 rounded-md text-[12.5px] text-left transition-colors',
            active ? 'text-primary-700 dark:text-primary-200 font-medium' : 'text-fg-2 hover:bg-surface-2',
        )}
    >
        {active && (
            <motion.span
                layoutId="finder-side-active"
                className="absolute inset-0 rounded-md bg-primary-500/15"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            />
        )}
        <span className="relative flex items-center gap-2 min-w-0 truncate">{children}</span>
    </button>
);

const ViewToggle: React.FC<{ view: View; onChange: (v: View) => void }> = ({ view, onChange }) => (
    <div className="relative inline-flex items-center rounded-md border border-line bg-surface-2/60 p-0.5" role="tablist" aria-label="Kiểu hiển thị">
        {([['grid', LayoutGrid, 'Lưới'], ['list', List, 'Danh sách']] as const).map(([v, Icon, label]) => (
            <button
                key={v}
                role="tab"
                aria-selected={view === v}
                aria-label={label}
                title={label}
                onClick={() => onChange(v)}
                className={cn('relative w-7 h-6 rounded flex items-center justify-center transition-colors', view === v ? 'text-fg' : 'text-fg-subtle hover:text-fg-2')}
            >
                {view === v && (
                    <motion.span layoutId="finder-view-pill" className="absolute inset-0 rounded bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
                )}
                <Icon className="relative w-3.5 h-3.5" />
            </button>
        ))}
    </div>
);

/** Tiêu đề nhóm kiểu Finder "group by kind": chấm màu · tên · số mục · kẻ ngang. */
const GroupHeader: React.FC<{ group: Group }> = ({ group }) => (
    <header className="flex items-center gap-2 mb-3 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
        <span className={cn('w-1.5 h-1.5 rounded-full', group.variant === 'pro' ? 'bg-primary-500' : group.variant === 'free' ? 'bg-emerald-500' : 'bg-amber-500')} />
        {group.title}
        <span className="text-fg-subtle normal-case tracking-normal">— {group.items.length} mục</span>
        <span className="flex-1 h-px bg-line" />
    </header>
);

/** List view kiểu Finder: cột Tên · Cấp độ · Bài · Thời lượng · Giá. */
const ListView: React.FC<{ groups: Group[] }> = ({ groups }) => {
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            {groups.map((g) => (
                <section key={g.id}>
                    <GroupHeader group={g} />
                    <div className="rounded-lg border border-line overflow-hidden">
                        <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_6rem_4rem_5rem_6rem] items-center gap-3 px-3 h-8 bg-surface-2/60 border-b border-line font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                            <span />
                            <span>Tên</span>
                            <span className="hidden sm:inline">Cấp độ</span>
                            <span className="hidden sm:inline">Bài</span>
                            <span className="hidden sm:inline">Thời lượng</span>
                            <span className="text-right">Giá</span>
                        </div>
                        <motion.ul
                            variants={gridVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                            className="divide-y divide-line-2"
                        >
                            {g.items.map(({ course, variant }) => {
                                const lvl = LEVELS.find((l) => l.id === course.level) ?? LEVELS[0];
                                const gradient = THUMBNAIL_GRADIENTS[course.id % THUMBNAIL_GRADIENTS.length];
                                return (
                                    <motion.li
                                        key={course.id}
                                        variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_6rem_4rem_5rem_6rem] items-center gap-3 px-3 h-14 cursor-pointer transition-colors hover:bg-primary-500/[0.06]"
                                    >
                                        <span className={cn('flex w-9 h-9 items-center justify-center rounded-lg bg-gradient-to-br text-white font-mono font-bold text-sm', gradient)}>
                                            {course.title.charAt(0)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-fg truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{course.title}</p>
                                            <p className="text-[11px] text-fg-muted truncate">{course.description}</p>
                                        </div>
                                        <span className="hidden sm:block"><Badge variant={lvl.badge} size="sm" className="normal-case tracking-normal">{lvl.label}</Badge></span>
                                        <span className="hidden sm:inline font-mono text-[11px] text-fg-muted tabular-nums">{course.lessonCount}</span>
                                        <span className="hidden sm:inline font-mono text-[11px] text-fg-muted tabular-nums">{formatDurationSeconds(course.totalDurationSeconds)}</span>
                                        <span className="flex items-center justify-end gap-1.5 font-mono text-[12px] font-semibold tabular-nums">
                                            {variant === 'pro'
                                                ? <span className="text-fg">{course.price.toLocaleString('vi-VN')} ₫</span>
                                                : <span className="text-code-600 dark:text-emerald-400">Miễn phí</span>}
                                            <ArrowRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                        </span>
                                    </motion.li>
                                );
                            })}
                        </motion.ul>
                    </div>
                </section>
            ))}
        </div>
    );
};

const EmptyState: React.FC<{ query: string }> = ({ query }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-subtle mb-3">
            <Inbox className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-fg-2">Không có mục nào</p>
        <p className="font-mono text-[11px] text-fg-subtle mt-1">
            {query.trim() ? <>{'// '}không khớp "{query.trim()}"</> : <>{'// '}thử bỏ bộ lọc cấp độ</>}
        </p>
    </div>
);

const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-card">
        <div className="aspect-[16/9] shimmer" />
        <div className="p-4 space-y-3">
            <div className="flex justify-between">
                <div className="h-4 w-16 rounded-full shimmer" />
                <div className="h-4 w-12 rounded-full shimmer" />
            </div>
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-3 w-full rounded shimmer" />
            <div className="h-3 w-2/3 rounded shimmer" />
            <div className="h-px bg-line-2" />
            <div className="flex justify-between items-center">
                <div className="h-5 w-16 rounded shimmer" />
                <div className="h-8 w-24 rounded-lg shimmer" />
            </div>
        </div>
    </div>
);

export default CourseFinder;
