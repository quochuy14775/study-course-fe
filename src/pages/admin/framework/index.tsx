import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Layers, LayoutGrid, List as ListIcon, Check } from 'lucide-react';
import type { Framework, FrameworkRequest } from "../../../types/framework";
import frameworkService from "../../../services/frameworkService";
import { showToast } from "../../../components/CustomToast";
import { Tooltip } from "../../../components/ui/Tooltip";
import { resolveFrameworkBrand, CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, tint, type TechCategory } from "../../../lib/techBrand";
import { cn } from "../../../lib/cn";
import FrameworkListItem from './FrameworkListItem';
import FrameworkCard from './FrameworkCard';
import FrameworkDialog from './FrameworkDialog';

type GroupKey = TechCategory | 'none';
type CategoryFilter = 'all' | GroupKey;
type View = 'grid' | 'list';

const VIEW_KEY = 'admin-frameworks-view';

/** Thứ tự nhóm khi sắp xếp / hiện section: theo bảng CATEGORIES, "chưa phân nhóm" cuối cùng */
const GROUP_ORDER: GroupKey[] = [...CATEGORIES, 'none'];

const groupColor = (k: CategoryFilter): string =>
    k === 'all' ? 'rgb(var(--color-primary-500))'
    : k === 'none' ? 'rgb(var(--fg-subtle))'
    : CATEGORY_COLOR[k];

const groupLabel = (k: CategoryFilter): string =>
    k === 'all' ? 'Tất cả' : k === 'none' ? 'Chưa phân nhóm' : CATEGORY_LABEL[k];

/** Mốc góc kiểu bản vẽ cho ô trống */
const Corner: React.FC<{ className: string }> = ({ className }) => (
    <span className={cn('absolute w-4 h-4 border-line-2', className)} aria-hidden />
);

/** Tiêu đề section theo nhóm — khai báo ngoài component để không bị remount mỗi lần render */
const SectionHeader: React.FC<{ k: GroupKey; count: number; className?: string }> = ({ k, count, className }) => {
    const color = groupColor(k);
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color }}>{groupLabel(k)}</span>
            <span className="text-[11px] text-fg-subtle tabular-nums">{count}</span>
            <span className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${tint(color, 45)}, transparent)` }} />
        </div>
    );
};

const FrameworkManagement: React.FC = () => {
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [view, setView] = useState<View>(() => {
        try { return (localStorage.getItem(VIEW_KEY) as View) || 'grid'; } catch { return 'grid'; }
    });
    const [modal, setModal] = useState<{ open: boolean; framework: Framework | null }>({ open: false, framework: null });

    const PAGE_SIZE = view === 'grid' ? 12 : 10;

    const fetchFrameworks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await frameworkService.getFrameworks();
            setFrameworks(data);
        } catch {
            showToast.error("Không thể tải danh sách framework");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFrameworks(); }, [fetchFrameworks]);

    useEffect(() => {
        const timer = setTimeout(() => { setSearchQuery(searchInput.trim()); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        try { localStorage.setItem(VIEW_KEY, view); } catch { /* ignore */ }
    }, [view]);

    // Nhóm đã resolve (DB → bảng) cho từng framework, dùng cho lọc + đếm + sắp xếp
    const resolved = useMemo(
        () => new Map(frameworks.map(f => [f.id, resolveFrameworkBrand(f)])),
        [frameworks],
    );
    const groupOf = useCallback((f: Framework): GroupKey => resolved.get(f.id)?.category ?? 'none', [resolved]);

    /** Framework theo từng nhóm (để đếm + hiện logo trên thẻ nhóm) */
    const byGroup = useMemo(() => {
        const m = new Map<GroupKey, Framework[]>();
        frameworks.forEach(f => {
            const k = groupOf(f);
            if (!m.has(k)) m.set(k, []);
            m.get(k)!.push(f);
        });
        return m;
    }, [frameworks, groupOf]);

    const activeGroups = GROUP_ORDER.filter(k => (byGroup.get(k)?.length ?? 0) > 0);

    /** Lọc rồi sắp theo nhóm → tên, để các section liền nhau khi phân trang */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return frameworks
            .filter(f => {
                if (q && !((f.name ?? '').toLowerCase().includes(q) || (f.slug ?? '').toLowerCase().includes(q))) return false;
                return category === 'all' || groupOf(f) === category;
            })
            .sort((a, b) => {
                const d = GROUP_ORDER.indexOf(groupOf(a)) - GROUP_ORDER.indexOf(groupOf(b));
                return d !== 0 ? d : (a.name ?? '').localeCompare(b.name ?? '', 'vi');
            });
    }, [frameworks, searchQuery, category, groupOf]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    /** Trang hiện tại chia theo nhóm — chỉ hiện tiêu đề section khi đang xem "Tất cả" */
    const sections = useMemo(() => {
        const m = new Map<GroupKey, Framework[]>();
        paginated.forEach(f => {
            const k = groupOf(f);
            if (!m.has(k)) m.set(k, []);
            m.get(k)!.push(f);
        });
        return GROUP_ORDER.filter(k => m.has(k)).map(k => ({ key: k, items: m.get(k)! }));
    }, [paginated, groupOf]);
    const showSectionHeaders = category === 'all' && sections.length > 1;

    const handleCreateOrUpdate = async (data: FrameworkRequest) => {
        try {
            if (modal.framework) {
                const updated = await frameworkService.updateFramework(modal.framework.id, data);
                setFrameworks(prev => prev.map(f => f.id === updated.id ? updated : f));
                showToast.success("Cập nhật framework thành công");
            } else {
                const created = await frameworkService.createFramework(data);
                setFrameworks(prev => [created, ...prev]);
                showToast.success("Thêm framework thành công");
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Thao tác thất bại");
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa framework này?")) return;
        try {
            await frameworkService.deleteFramework(id);
            setFrameworks(prev => prev.filter(f => f.id !== id));
            showToast.success("Xóa framework thành công");
        } catch {
            showToast.error("Xóa thất bại");
        }
    };

    const tiles: CategoryFilter[] = ['all', ...activeGroups];

    return (
        <main className="min-h-screen relative">
            {/* Nền blueprint: chấm + vệt mesh nhạt phía trên */}
            <div className="absolute inset-0 bg-dot-pattern bg-dot pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]" />
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-mesh pointer-events-none opacity-70" />

            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 animate-fade-in-up">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface/80 backdrop-blur text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 shadow-card">
                            <Layers size={12} />
                            Stack
                            <span className="w-px h-3 bg-line" aria-hidden />
                            <span className="text-fg-muted normal-case tracking-normal font-semibold">
                                {frameworks.length} framework · {activeGroups.filter(k => k !== 'none').length} nhóm
                            </span>
                        </div>
                        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-fg">
                            Quản lý <span className="bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent">Framework</span>
                        </h1>
                        <p className="mt-2 text-sm text-fg-muted max-w-xl">
                            Framework và thư viện dùng trong các khóa học — xếp theo nhóm, mỗi cái đứng trên nền ngôn ngữ của nó.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="inline-flex items-center rounded-full border border-line bg-surface p-1 shadow-card" role="tablist" aria-label="Kiểu hiển thị">
                            {([['grid', LayoutGrid, 'Lưới'], ['list', ListIcon, 'Danh sách']] as const).map(([v, Icon, label]) => (
                                <Tooltip key={v} content={label} side="bottom">
                                    <button
                                        role="tab"
                                        aria-selected={view === v}
                                        aria-label={label}
                                        onClick={() => { setView(v); setPage(1); }}
                                        className={cn('relative w-9 h-8 rounded-full flex items-center justify-center transition-colors', view === v ? 'text-surface' : 'text-fg-muted hover:text-fg')}
                                    >
                                        {view === v && (
                                            <motion.span layoutId="fw-view-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                                        )}
                                        <Icon size={16} className="relative" />
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                        <button
                            onClick={() => setModal({ open: true, framework: null })}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold shadow-glow-primary hover:shadow-glow-accent hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Plus size={17} /> Thêm framework
                        </button>
                    </div>
                </div>

                {/* ── Rail thẻ nhóm (hero + filter) ── */}
                {frameworks.length > 0 && (
                    <div className="mt-6 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                        <div className="flex gap-3 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]" role="tablist" aria-label="Lọc theo nhóm">
                            {tiles.map((k, i) => {
                                const active = category === k;
                                const color = groupColor(k);
                                const items = k === 'all' ? frameworks : (byGroup.get(k) ?? []);
                                return (
                                    <motion.button
                                        key={k}
                                        role="tab"
                                        aria-selected={active}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
                                        whileHover={{ y: -3 }}
                                        onClick={() => { setCategory(k); setPage(1); }}
                                        className={cn(
                                            'relative w-40 flex-shrink-0 sm:w-auto text-left rounded-2xl border bg-surface p-3.5 shadow-card overflow-hidden',
                                            'transition-[border-color,box-shadow,background-color] duration-300',
                                            active ? 'shadow-[0_14px_30px_-14px_var(--cat-glow)]' : 'border-line hover:border-[color:var(--cat-line)]',
                                        )}
                                        style={{
                                            '--cat-line': tint(color, 45),
                                            '--cat-glow': tint(color, 40),
                                            borderColor: active ? color : undefined,
                                            background: active ? tint(color, 8) : undefined,
                                        } as React.CSSProperties}
                                    >
                                        {/* Thanh nhận diện nhóm */}
                                        <span className="absolute left-3.5 top-4 w-1 h-7 rounded-full" style={{ background: color }} aria-hidden />

                                        <div className="pl-3.5">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color }}>{groupLabel(k)}</span>
                                                {active && <Check size={12} strokeWidth={3} style={{ color }} />}
                                            </div>
                                            <div className="mt-0.5 text-2xl font-extrabold tabular-nums leading-none text-fg">{items.length}</div>

                                            {/* Logo xếp chồng — ô vuông bo góc */}
                                            <div className="mt-3 flex -space-x-1.5 h-6">
                                                {items.slice(0, 4).map(f => {
                                                    const b = resolved.get(f.id)!;
                                                    return (
                                                        <span
                                                            key={f.id}
                                                            className="w-6 h-6 rounded-md bg-surface ring-2 ring-surface flex items-center justify-center overflow-hidden text-[8px] font-black"
                                                            style={{ boxShadow: `0 0 0 1px ${tint(b.color, 60)}`, color: b.color }}
                                                            title={f.name}
                                                        >
                                                            {f.iconUrl
                                                                ? <img src={f.iconUrl} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                                                                : f.name.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    );
                                                })}
                                                {items.length > 4 && (
                                                    <span className="w-6 h-6 rounded-md bg-surface-2 ring-2 ring-surface text-fg-muted text-[9px] font-bold flex items-center justify-center">
                                                        +{items.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Tìm kiếm + đếm ── */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm framework theo tên hoặc slug…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            aria-label="Tìm framework"
                            className="w-full pl-11 pr-4 py-3 bg-surface border border-line rounded-full text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-sm text-fg-muted whitespace-nowrap">
                        <span>
                            Hiển thị <span className="font-semibold text-fg">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span>–<span className="font-semibold text-fg">{Math.min(page * PAGE_SIZE, filtered.length)}</span> / <span className="font-semibold text-fg">{filtered.length}</span>
                            {category !== 'all' && <span className="text-fg-subtle"> · {groupLabel(category)}</span>}
                        </span>
                        {loading && (
                            <span className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-300 text-xs font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 bg-current rounded-full" />
                                Đang tải
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Danh sách / lưới ── */}
                <div className={`mt-5 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {paginated.length > 0 ? (
                        /* Không dùng AnimatePresence mode="wait": với React 19 nó có thể kẹt ở exit và không mount view mới.
                           Đổi key theo view → view mới fade-in, view cũ gỡ ngay. */
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}
                        >
                            {sections.map(s => (
                                <React.Fragment key={s.key}>
                                    {showSectionHeaders && (
                                        <SectionHeader k={s.key} count={s.items.length} className={view === 'grid' ? 'col-span-full mt-2 first:mt-0' : 'pt-2 first:pt-0'} />
                                    )}
                                    {s.items.map(fw => view === 'grid'
                                        ? <FrameworkCard key={fw.id} framework={fw} onEdit={(f) => setModal({ open: true, framework: f })} onDelete={handleDelete} />
                                        : <FrameworkListItem key={fw.id} framework={fw} onEdit={(f) => setModal({ open: true, framework: f })} onDelete={handleDelete} />
                                    )}
                                </React.Fragment>
                            ))}
                        </motion.div>
                    ) : (
                        !loading && (
                            <div className="relative text-center py-14 bg-surface/70 border border-dashed border-line rounded-3xl">
                                <Corner className="top-3 left-3 border-t-2 border-l-2 rounded-tl" />
                                <Corner className="top-3 right-3 border-t-2 border-r-2 rounded-tr" />
                                <Corner className="bottom-3 left-3 border-b-2 border-l-2 rounded-bl" />
                                <Corner className="bottom-3 right-3 border-b-2 border-r-2 rounded-br" />
                                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4 [background-image:radial-gradient(rgb(var(--fg-subtle)/0.35)_1px,transparent_1px)] [background-size:8px_8px]">
                                    <Layers className="w-8 h-8 text-fg-subtle" />
                                </div>
                                <h3 className="text-lg font-bold text-fg">Không tìm thấy framework nào</h3>
                                <p className="text-fg-muted text-sm">Thử đổi từ khóa, chọn nhóm khác hoặc thêm mới</p>
                            </div>
                        )
                    )}
                </div>

                {/* ── Phân trang ── */}
                {filtered.length > PAGE_SIZE && (
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-line">
                        <div className="text-sm text-fg-muted">
                            Trang <span className="font-semibold text-fg">{page}</span> / <span className="font-semibold text-fg">{totalPages}</span>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-line bg-surface p-1 shadow-card gap-1">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} aria-label="Trang trước" className="w-8 h-8 rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                                <ChevronLeft size={17} />
                            </button>
                            <span className="px-2 text-xs font-semibold tabular-nums text-fg">{page}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading} aria-label="Trang sau" className="w-8 h-8 rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                )}

                <FrameworkDialog
                    open={modal.open}
                    framework={modal.framework}
                    onClose={() => setModal({ open: false, framework: null })}
                    onSubmit={handleCreateOrUpdate}
                />
            </div>
        </main>
    );
};

export default FrameworkManagement;
