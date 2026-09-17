import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown, Check, X, RotateCcw, Code2, Terminal, Star, Lock, Gift, Tag, BookOpen, ArrowUpDown } from 'lucide-react';
import { showToast } from "../../../components/CustomToast";
import { CourseRequest, CourseUI, mapCourseToUI } from "../../../types/course";
import AddCourseDialog from "./AddCourseDialog";
import EditCourseDialog from "./EditCourseDialog";
import DeleteCourseDialog from "./DeleteCourseDialog";
import courseService from "../../../services/courseServices";
import { ITEMS_PER_PAGE } from "../../../types/odata";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '../../../components/ui/DropdownMenu';
import { resolveLanguageBrand, resolveFrameworkBrand } from '../../../lib/techBrand';
import { cn } from '../../../lib/cn';
import CourseListItem from './CourseListItem';
import { LEVELS, LevelMeter } from './levelMeta';

/* ─────────────────────────────────────────────────────────────
   Truy vấn
   ───────────────────────────────────────────────────────────── */

type TypeFilter = '' | 'free' | 'paid' | 'featured' | 'inactive';
type SortKey = 'newest' | 'oldest' | 'name' | 'price_asc' | 'price_desc';
interface Query { search: string; level: string; type: TypeFilter; sort: SortKey; page: number }

const DEFAULT_QUERY: Query = { search: '', level: '', type: '', sort: 'newest', page: 1 };

const SORTS: Record<SortKey, { label: string; orderby: string }> = {
    newest:     { label: 'Mới nhất',        orderby: 'CreatedAt desc' },
    oldest:     { label: 'Cũ nhất',         orderby: 'CreatedAt asc' },
    name:       { label: 'Tên A → Z',       orderby: 'Title asc' },
    price_asc:  { label: 'Giá thấp → cao', orderby: 'Price asc' },
    price_desc: { label: 'Giá cao → thấp', orderby: 'Price desc' },
};

const TYPE_LABEL: Record<TypeFilter, string> = { '': 'Tất cả', free: 'Miễn phí', paid: 'Trả phí', featured: 'Nổi bật', inactive: 'Đang ẩn' };

/* ─────────────────────────────────────────────────────────────
   Mảnh UI
   ───────────────────────────────────────────────────────────── */

interface Option { value: string; label: string; icon?: React.ReactNode }

/** Nút lọc dạng "Type ▾" kiểu GitHub — nhãn mờ + giá trị đang chọn */
const FilterMenu: React.FC<{ label: string; value: string; options: Option[]; onChange: (v: string) => void; align?: 'start' | 'end' }> = ({ label, value, options, onChange, align = 'start' }) => {
    const current = options.find(o => o.value === value);
    const active = value !== '' && value !== 'newest';
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors',
                    active
                        ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300'
                        : 'border-line bg-surface text-fg-2 hover:bg-surface-2',
                )}>
                    <span className={active ? 'opacity-70' : 'text-fg-subtle'}>{label}:</span>
                    {current?.label}
                    <ChevronDown size={12} className="opacity-60" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="min-w-[11rem]">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                {options.map(o => (
                    <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)} className="py-2 text-xs">
                        <span className="w-4 flex justify-center text-fg-muted">{o.icon}</span>
                        <span className="flex-1">{o.label}</span>
                        {o.value === value && <Check size={13} className="text-primary-600 dark:text-primary-300" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/** Thanh ngôn ngữ kiểu GitHub: tỉ lệ công nghệ xuất hiện trong các khóa học đang hiển thị */
const StackBar: React.FC<{ courses: CourseUI[] }> = ({ courses }) => {
    const stack = useMemo(() => {
        const m = new Map<string, { name: string; color: string; n: number }>();
        courses.forEach(c => {
            (c.languages ?? []).forEach(l => { const k = `l${l.id}`; const e = m.get(k); if (e) e.n++; else m.set(k, { name: l.name, color: resolveLanguageBrand(l).color, n: 1 }); });
            (c.frameworks ?? []).forEach(f => { const k = `f${f.id}`; const e = m.get(k); if (e) e.n++; else m.set(k, { name: f.name, color: resolveFrameworkBrand(f).color, n: 1 }); });
        });
        const arr = Array.from(m.values()).sort((a, b) => b.n - a.n);
        const total = arr.reduce((s, x) => s + x.n, 0);
        return { arr, total };
    }, [courses]);

    if (stack.total === 0) return null;
    const shown = stack.arr.slice(0, 6);
    const rest = stack.arr.length - shown.length;

    return (
        <div className="mt-5">
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-surface-3 gap-px" role="img" aria-label="Tỉ lệ công nghệ của các khóa học đang hiển thị">
                {stack.arr.map((t, i) => (
                    <motion.span
                        key={t.name + i}
                        initial={{ flexGrow: 0 }}
                        animate={{ flexGrow: t.n }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ background: t.color, flexBasis: 0 }}
                        title={`${t.name} · ${Math.round((t.n / stack.total) * 100)}%`}
                    />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                {shown.map((t, i) => (
                    <span key={t.name + i} className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: t.color }} />
                        <span className="font-medium text-fg-2">{t.name}</span>
                        <span className="font-mono tabular-nums">{Math.round((t.n / stack.total) * 100)}%</span>
                    </span>
                ))}
                {rest > 0 && <span className="text-fg-subtle">+{rest} khác</span>}
            </div>
        </div>
    );
};

/** Danh sách số trang có dấu … */
const pageItems = (page: number, total: number): Array<number | '…'> => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const s = new Set<number>([1, total, page - 1, page, page + 1].filter(p => p >= 1 && p <= total));
    const arr = Array.from(s).sort((a, b) => a - b);
    const out: Array<number | '…'> = [];
    arr.forEach((p, i) => { if (i > 0 && p - arr[i - 1] > 1) out.push('…'); out.push(p); });
    return out;
};

const RowSkeleton: React.FC = () => (
    <li className="flex gap-4 px-5 py-4">
        <span className="shimmer w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2.5 py-0.5">
            <span className="shimmer block h-4 w-1/3 rounded" />
            <span className="shimmer block h-3 w-3/4 rounded" />
            <div className="flex gap-2 pt-1"><span className="shimmer h-6 w-20 rounded-full" /><span className="shimmer h-6 w-16 rounded-full" /></div>
        </div>
    </li>
);

/* ─────────────────────────────────────────────────────────────
   Trang
   ───────────────────────────────────────────────────────────── */

const CourseManagement: React.FC = () => {
    const [courses, setCourses]       = useState<CourseUI[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [refreshNonce, setRefreshNonce] = useState(0);

    const [showAddCourseModal, setShowAddCourseModal] = useState(false);
    const [editingCourse, setEditingCourse]           = useState<CourseUI | null>(null);
    const [deletingCourse, setDeletingCourse]         = useState<CourseUI | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState<Query>(DEFAULT_QUERY);
    const navigate = useNavigate();

    /* ── OData filter ── */
    const buildFilter = (q: Query): string | undefined => {
        const clauses: string[] = [];
        if (q.search.trim()) {
            const s = q.search.toLowerCase().replace(/'/g, "''");
            clauses.push(`(contains(tolower(Title),'${s}') or contains(tolower(Description),'${s}'))`);
        }
        if (q.level) clauses.push(`Level eq '${q.level}'`);
        if (q.type === 'free') clauses.push(`Price eq 0`);
        else if (q.type === 'paid') clauses.push(`Price gt 0`);
        else if (q.type === 'featured') clauses.push(`IsFeatured eq true`);
        else if (q.type === 'inactive') clauses.push(`IsActive eq false`);
        return clauses.length ? clauses.join(' and ') : undefined;
    };

    /* ── Tải dữ liệu ── */
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const filter = buildFilter(query);
                const data = await courseService.getCourses({
                    count: true,
                    top: ITEMS_PER_PAGE,
                    skip: (query.page - 1) * ITEMS_PER_PAGE,
                    orderby: SORTS[query.sort].orderby,
                    ...(filter && { filter }),
                });
                if (!mounted) return;
                setCourses((data.value || []).map(mapCourseToUI));
                setTotalCount(data.count ?? 0);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                if (!mounted) return;
                setError('Không tải được danh sách khóa học.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.search, query.level, query.type, query.sort, query.page, refreshNonce]);

    /* ── Debounce tìm kiếm ── */
    useEffect(() => {
        const id = setTimeout(() => {
            setQuery(prev => {
                const s = searchInput.trim();
                return prev.search === s ? prev : { ...prev, search: s, page: 1 };
            });
        }, 500);
        return () => clearTimeout(id);
    }, [searchInput]);

    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
    const hasFilter = !!(query.search || query.level || query.type);
    const patch = (p: Partial<Query>) => setQuery(prev => ({ ...prev, ...p, page: 1 }));
    const resetFilters = () => { setSearchInput(''); setQuery(q => ({ ...DEFAULT_QUERY, sort: q.sort })); };
    const refresh = () => setRefreshNonce(n => n + 1);

    /* ── CRUD (giữ hành vi cũ) ── */
    const handleAddCourse = async (data: CourseRequest) => {
        try {
            const response = await courseService.createCourse(data);
            const newCourse: CourseUI = mapCourseToUI(response);
            setCourses(prev => { const next = [newCourse, ...prev]; if (next.length > ITEMS_PER_PAGE) next.pop(); return next; });
            setTotalCount(prev => prev + 1);
            showToast.success("Tạo khóa học thành công! Hãy thêm bài học ngay.");
            setShowAddCourseModal(false);
            const newId = response?.id ?? newCourse.id;
            if (newId) navigate(`/management/courses/${newId}/lessons`, { state: { courseTitle: newCourse.title } });
            return response;
        } catch (err: any) {
            console.error("Create failed", err);
            if (err?.response?.status === 400) throw err;
            showToast.error(err.response?.data?.message || 'Create failed');
            throw err;
        }
    };

    const handleDeleteCourse = async (id: number) => {
        const originalCourses = [...courses];
        const originalTotal = totalCount;
        setCourses(prev => {
            const remaining = prev.filter(c => c.id !== id);
            if (remaining.length === 0 && query.page > 1) setQuery(q => ({ ...q, page: q.page - 1 }));
            return remaining;
        });
        setTotalCount(prev => Math.max(0, prev - 1));
        setDeletingCourse(null);
        try {
            await courseService.deleteCourses([String(id)]);
            showToast.success("Xóa khóa học thành công");
        } catch (err) {
            console.error('Delete failed', err);
            showToast.error('Xóa thất bại, đang hoàn tác...');
            setCourses(originalCourses);
            setTotalCount(originalTotal);
        }
    };

    const handleUpdateCourse = async (id: number, data: CourseRequest) => {
        try {
            const updated = await courseService.updateCourse(id, data);
            setCourses(prev => prev.map(c => c.id === id ? mapCourseToUI(updated) : c));
            showToast.success("Cập nhật khóa học thành công");
            setEditingCourse(null);
            return updated;
        } catch (err: any) {
            if (err?.response?.status === 400) throw err;
            showToast.error(err?.response?.data?.message || "Cập nhật thất bại");
            throw err;
        }
    };

    const openLessons = (id: number, title?: string) => navigate(`/management/courses/${id}/lessons`, { state: { courseTitle: title } });

    /* ── Tuỳ chọn lọc ── */
    const typeOptions: Option[] = [
        { value: '', label: 'Tất cả', icon: <BookOpen size={12} /> },
        { value: 'free', label: 'Miễn phí', icon: <Gift size={12} className="text-emerald-500" /> },
        { value: 'paid', label: 'Trả phí', icon: <Tag size={12} className="text-amber-500" /> },
        { value: 'featured', label: 'Nổi bật', icon: <Star size={12} className="text-amber-500" fill="currentColor" /> },
        { value: 'inactive', label: 'Đang ẩn', icon: <Lock size={12} /> },
    ];
    const levelOptions: Option[] = [{ value: '', label: 'Tất cả' }, ...LEVELS.map(l => ({ value: l, label: l, icon: <LevelMeter level={l} /> }))];
    const sortOptions: Option[] = (Object.keys(SORTS) as SortKey[]).map(k => ({ value: k, label: SORTS[k].label }));

    const firstLoad = loading && courses.length === 0 && !error;
    const from = courses.length > 0 ? (query.page - 1) * ITEMS_PER_PAGE + 1 : 0;
    const to = Math.min(query.page * ITEMS_PER_PAGE, totalCount);

    return (
        <main className="min-h-screen relative">
            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* ── Header kiểu trang repo ── */}
                <div className="animate-fade-in-up">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
                        <Code2 size={13} className="text-primary-600 dark:text-primary-300" />
                        <span>eduhub</span>
                        <span className="text-fg-subtle">/</span>
                        <span className="font-semibold text-fg">courses</span>
                        <span className="ml-1.5 inline-flex items-center h-5 px-1.5 rounded-full border border-line text-[10px] font-semibold text-fg-muted tabular-nums">
                            {loading && courses.length === 0 ? '…' : totalCount}
                        </span>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">Quản lý khóa học</h1>
                            <p className="mt-1.5 text-sm text-fg-muted max-w-xl">
                                Mỗi khóa học là một repo: giáo trình là các commit, chương là branch, stack là công nghệ đi kèm.
                            </p>
                        </div>
                    </div>

                    {/* Language bar tổng hợp của trang */}
                    {!error && <StackBar courses={courses} />}
                </div>

                {/* ── Thanh lọc kiểu Repositories ── */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" size={14} />
                        <input
                            type="text"
                            placeholder="Tìm khóa học…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            aria-label="Tìm khóa học"
                            className="w-full h-9 pl-9 pr-3 bg-surface border border-line rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterMenu label="Loại" value={query.type} options={typeOptions} onChange={(v) => patch({ type: v as TypeFilter })} />
                        <FilterMenu label="Cấp độ" value={query.level} options={levelOptions} onChange={(v) => patch({ level: v })} />
                        <FilterMenu label="Sắp xếp" value={query.sort} options={sortOptions} onChange={(v) => patch({ sort: v as SortKey })} align="end" />
                        <button
                            onClick={() => setShowAddCourseModal(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all whitespace-nowrap"
                        >
                            <Plus size={14} /> Thêm khóa học
                        </button>
                    </div>
                </div>

                {/* ── Kết quả + filter đang áp ── */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-fg-muted min-h-[1.75rem]">
                    <span>
                        <span className="font-semibold text-fg tabular-nums">{totalCount}</span> khóa học
                        {query.search && <> khớp <span className="font-mono text-fg">"{query.search}"</span></>}
                    </span>
                    {(query.level || query.type) && <span className="text-fg-subtle">·</span>}
                    {query.type && (
                        <button onClick={() => patch({ type: '' })} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full bg-surface-2 border border-line text-xs font-medium text-fg-2 hover:border-fg-subtle transition-colors">
                            {TYPE_LABEL[query.type]} <X size={11} />
                        </button>
                    )}
                    {query.level && (
                        <button onClick={() => patch({ level: '' })} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full bg-surface-2 border border-line text-xs font-medium text-fg-2 hover:border-fg-subtle transition-colors">
                            {query.level} <X size={11} />
                        </button>
                    )}
                    {hasFilter && (
                        <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline">
                            <RotateCcw size={11} /> Xóa lọc
                        </button>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs">
                        <ArrowUpDown size={11} /> {SORTS[query.sort].label}
                        {loading && courses.length > 0 && <span className="ml-2 inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-300 font-semibold animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-current" /> đang tải</span>}
                    </span>
                </div>

                {/* ── Box danh sách ── */}
                <div className={cn('mt-3 rounded-xl border border-line bg-surface shadow-card overflow-hidden transition-opacity duration-200', loading && courses.length > 0 && 'opacity-60 pointer-events-none')}>
                    {error ? (
                        <div className="py-14 text-center">
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            <button onClick={refresh} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"><RotateCcw size={13} /> Thử lại</button>
                        </div>
                    ) : firstLoad ? (
                        <ul className="divide-y divide-line">{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</ul>
                    ) : courses.length === 0 ? (
                        <div className="py-14 px-6 text-center">
                            <Terminal className="w-9 h-9 text-fg-subtle mx-auto mb-3" />
                            <p className="font-semibold text-fg">{hasFilter ? 'Không có khóa học khớp bộ lọc' : 'Chưa có khóa học nào'}</p>
                            <p className="mt-1 font-mono text-xs text-fg-subtle">
                                <span className="text-primary-600 dark:text-primary-300">$</span> {hasFilter ? 'eduhub courses list --reset' : 'eduhub courses init'}
                            </p>
                            {hasFilter
                                ? <button onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-line bg-surface text-sm font-semibold text-fg hover:bg-surface-2 transition-colors"><RotateCcw size={13} /> Xóa lọc</button>
                                : <button onClick={() => setShowAddCourseModal(true)} className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"><Plus size={14} /> Thêm khóa học</button>}
                        </div>
                    ) : (
                        <ul className="divide-y divide-line">
                            {courses.map(course => (
                                <CourseListItem
                                    key={course.id}
                                    course={course}
                                    onClick={() => openLessons(course.id, course.title)}
                                    onDelete={(id) => setDeletingCourse(courses.find(c => c.id === id) ?? null)}
                                    onEdit={setEditingCourse}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Phân trang ── */}
                {!error && !firstLoad && totalCount > ITEMS_PER_PAGE && (
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-muted">
                        <span className="font-mono tabular-nums">{from}–{to} / {totalCount}</span>
                        <nav className="inline-flex items-center gap-1" aria-label="Phân trang">
                            <button onClick={() => setQuery(q => ({ ...q, page: Math.max(1, q.page - 1) }))} disabled={query.page === 1 || loading}
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-fg-muted hover:bg-surface hover:text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft size={14} /> Trước
                            </button>
                            {pageItems(query.page, totalPages).map((p, i) => p === '…'
                                ? <span key={`e${i}`} className="w-8 text-center text-fg-subtle">…</span>
                                : (
                                    <button key={p} onClick={() => setQuery(q => ({ ...q, page: p }))} disabled={loading} aria-current={p === query.page ? 'page' : undefined}
                                        className={cn('min-w-8 h-8 px-2 rounded-lg font-mono tabular-nums transition-colors', p === query.page ? 'bg-primary-600 text-white font-semibold' : 'text-fg-muted hover:bg-surface hover:text-fg')}>
                                        {p}
                                    </button>
                                ))}
                            <button onClick={() => setQuery(q => ({ ...q, page: Math.min(totalPages, q.page + 1) }))} disabled={query.page >= totalPages || loading}
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-fg-muted hover:bg-surface hover:text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                Sau <ChevronRight size={14} />
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            <AddCourseDialog open={showAddCourseModal} onClose={() => setShowAddCourseModal(false)} onSubmit={handleAddCourse} />
            <EditCourseDialog open={editingCourse !== null} course={editingCourse} onClose={() => setEditingCourse(null)} onSubmit={handleUpdateCourse} />
            <DeleteCourseDialog course={deletingCourse} onClose={() => setDeletingCourse(null)} onConfirm={handleDeleteCourse} />
        </main>
    );
};

export default CourseManagement;
