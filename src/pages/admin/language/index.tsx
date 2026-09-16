import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Code2, LayoutGrid, List as ListIcon } from 'lucide-react';
import type { Language, LanguageRequest } from "../../../types/language";
import languageService from "../../../services/languageService";
import { showToast } from "../../../components/CustomToast";
import { Tooltip } from "../../../components/ui/Tooltip";
import { resolveLanguageBrand } from "../../../lib/techBrand";
import { cn } from "../../../lib/cn";
import LanguageListItem from './LanguageListItem';
import LanguageCard from './LanguageCard';
import LanguageDialog from './LanguageDialog';

type Filter = 'all' | 'with' | 'without' | 'inactive';
type View = 'grid' | 'list';

const VIEW_KEY = 'admin-languages-view';

const LanguageManagement: React.FC = () => {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [view, setView] = useState<View>(() => {
        try { return (localStorage.getItem(VIEW_KEY) as View) || 'grid'; } catch { return 'grid'; }
    });
    const [modal, setModal] = useState<{ open: boolean; language: Language | null }>({ open: false, language: null });

    const PAGE_SIZE = view === 'grid' ? 12 : 10;

    const fetchLanguages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await languageService.getLanguages();
            setLanguages(data);
        } catch {
            showToast.error("Không thể tải danh sách ngôn ngữ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

    useEffect(() => {
        const timer = setTimeout(() => { setSearchQuery(searchInput.trim()); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        try { localStorage.setItem(VIEW_KEY, view); } catch { /* ignore */ }
    }, [view]);

    const brands = useMemo(() => new Map(languages.map(l => [l.id, resolveLanguageBrand(l)])), [languages]);

    const counts = useMemo(() => ({
        all: languages.length,
        with: languages.filter(l => (l.frameworks?.length ?? 0) > 0).length,
        without: languages.filter(l => (l.frameworks?.length ?? 0) === 0).length,
        inactive: languages.filter(l => !l.isActive).length,
    }), [languages]);

    const totalFrameworks = useMemo(
        () => new Set(languages.flatMap(l => (l.frameworks ?? []).map(f => f.id))).size,
        [languages],
    );

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return languages.filter(l => {
            if (q && !(l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q))) return false;
            const n = l.frameworks?.length ?? 0;
            if (filter === 'with') return n > 0;
            if (filter === 'without') return n === 0;
            if (filter === 'inactive') return !l.isActive;
            return true;
        });
    }, [languages, searchQuery, filter]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleCreateOrUpdate = async (data: LanguageRequest) => {
        try {
            if (modal.language) {
                const updated = await languageService.updateLanguage(modal.language.id, data);
                setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l));
                showToast.success("Cập nhật ngôn ngữ thành công");
            } else {
                const created = await languageService.createLanguage(data);
                setLanguages(prev => [created, ...prev]);
                showToast.success("Thêm ngôn ngữ thành công");
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Thao tác thất bại");
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ngôn ngữ này?")) return;
        try {
            await languageService.deleteLanguage(id);
            setLanguages(prev => prev.filter(l => l.id !== id));
            showToast.success("Xóa ngôn ngữ thành công");
        } catch {
            showToast.error("Xóa thất bại");
        }
    };

    const chips: Array<{ id: Filter; label: string }> = [
        { id: 'all', label: 'Tất cả' },
        { id: 'with', label: 'Có framework' },
        { id: 'without', label: 'Chưa có framework' },
        ...(counts.inactive > 0 ? [{ id: 'inactive' as Filter, label: 'Đang ẩn' }] : []),
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
                            <span>languages</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 dark:bg-primary-300 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-fg">Quản lý ngôn ngữ</h1>
                        <p className="text-fg-muted mt-1 text-sm">Ngôn ngữ lập trình dùng trong các khóa học</p>

                        {/* Dải logo — mỗi cái viền màu thương hiệu riêng */}
                        {languages.length > 0 && (
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {languages.slice(0, 12).map((l, i) => {
                                        const b = brands.get(l.id)!;
                                        return (
                                            <Tooltip key={l.id} content={l.name} side="bottom">
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.6 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
                                                    whileHover={{ y: -4, scale: 1.12, zIndex: 10 }}
                                                    onClick={() => setModal({ open: true, language: l })}
                                                    aria-label={l.name}
                                                    className="relative w-9 h-9 rounded-full bg-surface flex items-center justify-center overflow-hidden ring-2 ring-surface"
                                                    style={{ boxShadow: `0 0 0 2px ${b.color}` }}
                                                >
                                                    {l.iconUrl
                                                        ? <img src={l.iconUrl} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                                                        : <span className="text-[10px] font-mono font-black" style={{ color: b.color }}>{l.name.slice(0, 2).toUpperCase()}</span>}
                                                </motion.button>
                                            </Tooltip>
                                        );
                                    })}
                                    {languages.length > 12 && (
                                        <span className="w-9 h-9 rounded-full bg-surface-2 text-fg-muted text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                                            +{languages.length - 12}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-fg-muted">
                                    <span className="font-semibold text-fg">{languages.length}</span> ngôn ngữ · <span className="font-semibold text-fg">{totalFrameworks}</span> framework liên quan
                                </span>
                            </div>
                        )}
                    </section>

                    <div className="flex items-center gap-2 flex-shrink-0">
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
                                            <motion.span layoutId="lang-view-pill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 shadow-glow-primary" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                                        )}
                                        <Icon size={16} className="relative" />
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                        <button
                            onClick={() => setModal({ open: true, language: null })}
                            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Plus size={18} /> Thêm ngôn ngữ
                        </button>
                    </div>
                </div>

                {/* ── Tìm kiếm + lọc ── */}
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
                    {languages.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {chips.map(chip => {
                                const active = filter === chip.id;
                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => { setFilter(chip.id); setPage(1); }}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all',
                                            active ? 'bg-fg text-surface border-fg shadow-sm' : 'bg-surface text-fg-muted border-line hover:bg-surface-2',
                                        )}
                                    >
                                        {chip.label}
                                        <span className={cn('tabular-nums', active ? 'opacity-70' : 'text-fg-subtle')}>{counts[chip.id]}</span>
                                    </button>
                                );
                            })}
                            {searchQuery && (
                                <span className="ml-auto text-xs text-fg-muted"><span className="font-semibold text-fg">{filtered.length}</span> kết quả</span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Đếm ── */}
                <div className="mb-4 text-sm text-fg-muted flex justify-between items-center">
                    <div>
                        Hiển thị <span className="font-semibold text-fg">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> đến <span className="font-semibold text-fg">{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-fg">{filtered.length}</span> ngôn ngữ
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
                                    {paginated.map(lang => (
                                        <LanguageCard key={lang.id} language={lang} onEdit={(l) => setModal({ open: true, language: l })} onDelete={handleDelete} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                                    {paginated.map(lang => (
                                        <LanguageListItem key={lang.id} language={lang} onEdit={(l) => setModal({ open: true, language: l })} onDelete={handleDelete} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : (
                        !loading && (
                            <div className="text-center py-12 bg-surface border-2 border-dashed border-line rounded-3xl shadow-card">
                                <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Code2 className="w-8 h-8 text-fg-subtle" />
                                </div>
                                <h3 className="text-lg font-bold text-fg">Không tìm thấy ngôn ngữ nào</h3>
                                <p className="text-fg-muted text-sm">Thử đổi từ khóa, bỏ lọc hoặc thêm mới</p>
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

                <LanguageDialog
                    open={modal.open}
                    language={modal.language}
                    onClose={() => setModal({ open: false, language: null })}
                    onSubmit={handleCreateOrUpdate}
                />
            </div>
        </main>
    );
};

export default LanguageManagement;
