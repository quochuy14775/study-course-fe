import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Layers, LayoutGrid, List as ListIcon } from 'lucide-react';
import type { Framework, FrameworkRequest } from "../../../types/framework";
import frameworkService from "../../../services/frameworkService";
import { showToast } from "../../../components/CustomToast";
import { Tooltip } from "../../../components/ui/Tooltip";
import { resolveFrameworkBrand, CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, onBrand, type TechCategory } from "../../../lib/techBrand";
import { cn } from "../../../lib/cn";
import FrameworkListItem from './FrameworkListItem';
import FrameworkCard from './FrameworkCard';
import FrameworkDialog from './FrameworkDialog';

type CategoryFilter = 'all' | TechCategory | 'none';
type View = 'grid' | 'list';

const VIEW_KEY = 'admin-frameworks-view';

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

    // Nhóm đã resolve (DB → bảng) cho từng framework, dùng cho lọc + đếm
    const resolved = useMemo(
        () => new Map(frameworks.map(f => [f.id, resolveFrameworkBrand(f)])),
        [frameworks],
    );

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: frameworks.length, none: 0 };
        CATEGORIES.forEach(k => { c[k] = 0; });
        frameworks.forEach(f => {
            const cat = resolved.get(f.id)?.category;
            c[cat ?? 'none'] += 1;
        });
        return c;
    }, [frameworks, resolved]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return frameworks.filter(f => {
            if (q && !(f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q))) return false;
            if (category === 'all') return true;
            const cat = resolved.get(f.id)?.category;
            return category === 'none' ? !cat : cat === category;
        });
    }, [frameworks, searchQuery, category, resolved]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

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

    const chips: Array<{ id: CategoryFilter; label: string; color?: string }> = [
        { id: 'all', label: 'Tất cả' },
        ...CATEGORIES.filter(c => counts[c] > 0).map(c => ({ id: c as CategoryFilter, label: CATEGORY_LABEL[c], color: CATEGORY_COLOR[c] })),
        ...(counts.none > 0 ? [{ id: 'none' as CategoryFilter, label: 'Chưa phân nhóm' }] : []),
    ];

    return (
        <main className="min-h-screen relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 animate-fade-in-up">
                    <section className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-mono text-primary-600 dark:text-primary-300 mb-2">
                            <span className="text-fg-subtle">~/</span>
                            <span>management</span>
                            <span className="text-fg-subtle">/</span>
                            <span>frameworks</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 dark:bg-primary-300 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-fg">Quản lý Framework</h1>
                        <p className="text-fg-muted mt-1 text-sm">Framework và thư viện dùng trong các khóa học</p>

                        {/* Dải logo — mỗi cái viền màu thương hiệu riêng */}
                        {frameworks.length > 0 && (
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {frameworks.slice(0, 12).map((f, i) => {
                                        const b = resolved.get(f.id)!;
                                        return (
                                            <Tooltip key={f.id} content={f.name} side="bottom">
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.6 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
                                                    whileHover={{ y: -4, scale: 1.12, zIndex: 10 }}
                                                    onClick={() => setModal({ open: true, framework: f })}
                                                    aria-label={f.name}
                                                    className="relative w-9 h-9 rounded-full bg-surface flex items-center justify-center overflow-hidden ring-2 ring-surface"
                                                    style={{ boxShadow: `0 0 0 2px ${b.color}` }}
                                                >
                                                    {f.iconUrl
                                                        ? <img src={f.iconUrl} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                                                        : <span className="text-[10px] font-black" style={{ color: b.color }}>{f.name.slice(0, 2).toUpperCase()}</span>}
                                                </motion.button>
                                            </Tooltip>
                                        );
                                    })}
                                    {frameworks.length > 12 && (
                                        <span className="w-9 h-9 rounded-full bg-surface-2 text-fg-muted text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                                            +{frameworks.length - 12}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-fg-muted">
                                    <span className="font-semibold text-fg">{frameworks.length}</span> framework · {CATEGORIES.filter(c => counts[c] > 0).length} nhóm
                                </span>
                            </div>
                        )}
                    </section>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Chuyển lưới / danh sách */}
                        <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist" aria-label="Kiểu hiển thị">
                            {([['grid', LayoutGrid, 'Lưới'], ['list', ListIcon, 'Danh sách']] as const).map(([v, Icon, label]) => (
                                <Tooltip key={v} content={label} side="bottom">
                                    <button
                                        role="tab"
                                        aria-selected={view === v}
                                        aria-label={label}
                                        onClick={() => { setView(v); setPage(1); }}
                                        className={cn('relative w-9 h-8 rounded-lg flex items-center justify-center transition-colors', view === v ? 'text-white' : 'text-fg-muted hover:text-fg')}
                                    >
                                        {view === v && (
                                            <motion.span layoutId="fw-view-pill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 shadow-glow-primary" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                                        )}
                                        <Icon size={16} className="relative" />
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                        <button
                            onClick={() => setModal({ open: true, framework: null })}
                            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-accent-600 to-primary-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Plus size={18} /> Thêm framework
                        </button>
                    </div>
                </div>

                {/* ── Tìm kiếm + lọc nhóm ── */}
                <div className="mb-5 p-3 sm:p-4 bg-surface border border-line rounded-2xl shadow-card space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc slug..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-surface-2/60 border border-line rounded-xl text-sm text-fg placeholder:text-fg-subtle focus:border-primary-400 focus:bg-surface focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        />
                    </div>

                    {frameworks.length > 0 && (
                        <>
                            {/* Thanh phân bố nhóm — khoảng hở 2px giữa các đoạn */}
                            <div className="flex h-1.5 w-full gap-[2px] rounded-full overflow-hidden" role="img" aria-label="Phân bố framework theo nhóm">
                                {CATEGORIES.filter(c => counts[c] > 0).map(c => (
                                    <motion.div
                                        key={c}
                                        initial={{ flexGrow: 0 }}
                                        animate={{ flexGrow: counts[c] }}
                                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ background: CATEGORY_COLOR[c], flexBasis: 0, opacity: category === 'all' || category === c ? 1 : 0.25 }}
                                        className="h-full first:rounded-l-full last:rounded-r-full transition-opacity"
                                    />
                                ))}
                                {counts.none > 0 && (
                                    <motion.div initial={{ flexGrow: 0 }} animate={{ flexGrow: counts.none }} className="h-full bg-surface-3 last:rounded-r-full" style={{ flexBasis: 0, opacity: category === 'all' || category === 'none' ? 1 : 0.25 }} />
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {chips.map(chip => {
                                    const active = category === chip.id;
                                    const color = chip.color ?? 'rgb(var(--fg-muted))';
                                    return (
                                        <button
                                            key={chip.id}
                                            onClick={() => { setCategory(chip.id); setPage(1); }}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all',
                                                active ? 'shadow-sm' : 'bg-surface text-fg-muted border-line hover:border-line hover:bg-surface-2',
                                            )}
                                            style={active ? { background: chip.color ?? 'rgb(var(--fg))', borderColor: chip.color ?? 'rgb(var(--fg))', color: chip.color ? onBrand(chip.color) : 'rgb(var(--surface))' } : undefined}
                                        >
                                            {chip.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? 'currentColor' : color }} />}
                                            {chip.label}
                                            <span className={cn('tabular-nums', active ? 'opacity-80' : 'text-fg-subtle')}>{counts[chip.id]}</span>
                                        </button>
                                    );
                                })}
                                {searchQuery && (
                                    <span className="ml-auto text-xs text-fg-muted"><span className="font-semibold text-fg">{filtered.length}</span> kết quả</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Đếm ── */}
                <div className="mb-4 text-sm text-fg-muted flex justify-between items-center">
                    <div>
                        Hiển thị <span className="font-semibold text-fg">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> đến <span className="font-semibold text-fg">{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-fg">{filtered.length}</span> framework
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-primary-600 text-xs font-semibold animate-pulse">
                            <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" />
                            ĐANG CẬP NHẬT...
                        </div>
                    )}
                </div>

                {/* ── Danh sách / lưới ── */}
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {paginated.length > 0 ? (
                        <AnimatePresence mode="wait" initial={false}>
                            {view === 'grid' ? (
                                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {paginated.map(fw => (
                                        <FrameworkCard key={fw.id} framework={fw} onEdit={(f) => setModal({ open: true, framework: f })} onDelete={handleDelete} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                                    {paginated.map(fw => (
                                        <FrameworkListItem key={fw.id} framework={fw} onEdit={(f) => setModal({ open: true, framework: f })} onDelete={handleDelete} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : (
                        !loading && (
                            <div className="text-center py-12 bg-surface border-2 border-dashed border-line rounded-3xl shadow-card">
                                <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="w-8 h-8 text-fg-subtle" />
                                </div>
                                <h3 className="text-lg font-bold text-fg">Không tìm thấy framework nào</h3>
                                <p className="text-fg-muted text-sm">Thử đổi từ khóa, bỏ lọc nhóm hoặc thêm mới</p>
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
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} className="p-2 border border-line rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading} className="p-2 border border-line rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight size={18} />
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
