import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Code2, LayoutGrid, List as ListIcon } from 'lucide-react';
import type { Language, LanguageRequest } from "../../../types/language";
import languageService from "../../../services/languageService";
import { showToast } from "../../../components/CustomToast";
import { Tooltip } from "../../../components/ui/Tooltip";
import { resolveLanguageBrand, tint, brandText } from "../../../lib/techBrand";
import { cn } from "../../../lib/cn";
import LanguageListItem, { LANGUAGE_ROW_COLS } from './LanguageListItem';
import LanguageCard from './LanguageCard';
import LanguageDialog from './LanguageDialog';

type Filter = 'all' | 'with' | 'without' | 'inactive';
type View = 'grid' | 'list';

const VIEW_KEY = 'admin-languages-view';

/** Con nháy nhấp nháy của editor */
const Caret: React.FC<{ className?: string }> = ({ className }) => (
    <span className={cn('inline-block w-[7px] h-[1.1em] align-text-bottom bg-primary-500 dark:bg-primary-400 animate-blink', className)} aria-hidden />
);

/** Một dòng trong "file" header: số dòng ở gutter + nội dung. */
const Line: React.FC<{ n: number; children: React.ReactNode; className?: string }> = ({ n, children, className }) => (
    <div className={cn('relative pl-12 sm:pl-14 flex items-baseline gap-2 leading-7', className)}>
        <span className="absolute left-0 w-10 sm:w-12 text-right pr-2 sm:pr-3 text-[11px] text-fg-subtle select-none tabular-nums leading-7" aria-hidden>
            {String(n).padStart(2, '0')}
        </span>
        {children}
    </div>
);

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

    const tabs: Array<{ id: Filter; label: string }> = [
        { id: 'all', label: 'Tất cả' },
        { id: 'with', label: 'Có framework' },
        { id: 'without', label: 'Chưa có framework' },
        ...(counts.inactive > 0 ? [{ id: 'inactive' as Filter, label: 'Đang ẩn' }] : []),
    ];

    const TOKEN_LIMIT = 10;

    /* Nút chuyển lưới/danh sách + Thêm — chỉ render MỘT lần (layoutId trùng sẽ làm framer ẩn pill) */
    const actions = (
        <>
            <div className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label="Kiểu hiển thị">
                {([['grid', LayoutGrid, 'Lưới'], ['list', ListIcon, 'Danh sách']] as const).map(([v, Icon, label]) => (
                    <Tooltip key={v} content={label} side="bottom">
                        <button
                            role="tab"
                            aria-selected={view === v}
                            aria-label={label}
                            onClick={() => { setView(v); setPage(1); }}
                            className={cn('relative w-8 h-7 rounded-md flex items-center justify-center transition-colors', view === v ? 'text-surface' : 'text-fg-muted hover:text-fg')}
                        >
                            {view === v && (
                                <motion.span layoutId="lang-view-pill" className="absolute inset-0 rounded-md bg-fg" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                            )}
                            <Icon size={14} className="relative" />
                        </button>
                    </Tooltip>
                ))}
            </div>
            <button
                onClick={() => setModal({ open: true, language: null })}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-fg text-surface font-mono text-xs font-semibold hover:bg-primary-600 hover:text-white active:scale-95 transition-all"
            >
                <Plus size={14} /> Thêm ngôn ngữ
            </button>
        </>
    );

    return (
        <main className="min-h-screen relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* ── Header: cửa sổ editor ── */}
                <section className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden animate-fade-in-up">
                    {/* Tab bar — mobile: cụm nút rớt xuống hàng riêng (flex-wrap), vẫn chỉ một instance */}
                    <div className="flex flex-wrap items-stretch pl-3 sm:pl-4 pr-2 sm:pr-3 bg-surface-2/70 border-b border-line">
                        <span className="hidden sm:flex items-center gap-1.5 mr-3 h-11" aria-hidden>
                            <span className="w-3 h-3 rounded-full bg-rose-400/80" />
                            <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                            <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                        </span>
                        <div className="relative flex items-center gap-2 h-11 px-3 bg-surface border-x border-line font-mono text-xs text-fg">
                            <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary-500 to-accent-500" />
                            <Code2 size={13} className="text-primary-600 dark:text-primary-300" />
                            languages.ts
                            {loading && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" title="Đang tải" />}
                        </div>
                        <span className="hidden md:flex items-center h-11 px-3 font-mono text-[11px] text-fg-subtle">~/management/languages</span>
                        <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2 py-2 sm:py-0 sm:h-11 border-t border-line/60 sm:border-0">{actions}</div>
                    </div>

                    {/* Thân file: gutter + các dòng */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-10 sm:w-12 bg-surface-2/40 border-r border-line-2" aria-hidden />
                        <div className="relative py-4 sm:py-5 pr-4 sm:pr-6 font-mono text-sm space-y-0.5">
                            <Line n={1}>
                                <span className="text-fg-subtle">{'//'}</span>
                                <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-fg leading-none">Quản lý ngôn ngữ</h1>
                            </Line>
                            <Line n={2}>
                                <span className="text-fg-subtle">{'//'}</span>
                                <p className="font-sans text-sm text-fg-muted">Ngôn ngữ lập trình dùng trong các khóa học</p>
                            </Line>
                            <Line n={3} className="mt-1">
                                <span className="text-accent-600 dark:text-accent-300">const</span>
                                <span className="text-fg">languages</span>
                                <span className="text-fg-muted">=</span>
                                <span className="text-fg-subtle">[</span>
                            </Line>
                            <Line n={4}>
                                <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 pl-4 min-h-[1.75rem]">
                                    {languages.length === 0 && !loading && (
                                        <span className="text-fg-subtle italic text-xs">{'/* chưa có ngôn ngữ nào */'}</span>
                                    )}
                                    {loading && languages.length === 0 && (
                                        <span className="text-fg-subtle text-xs animate-pulse">{'/* đang tải… */'}</span>
                                    )}
                                    {languages.slice(0, TOKEN_LIMIT).map((l, i) => {
                                        const b = brands.get(l.id)!;
                                        return (
                                            <React.Fragment key={l.id}>
                                                <motion.button
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.08 + i * 0.03, type: 'spring', stiffness: 400, damping: 24 }}
                                                    onClick={() => setModal({ open: true, language: l })}
                                                    className="inline-flex items-center gap-1.5 h-7 px-1.5 rounded-md text-[13px] font-semibold transition-colors hover:bg-[color:var(--tok-soft)]"
                                                    style={{ color: brandText(b.color), '--tok-soft': tint(b.color, 14) } as React.CSSProperties}
                                                    title={`Sửa ${l.name}`}
                                                >
                                                    {l.iconUrl
                                                        ? <img src={l.iconUrl} alt="" className={cn('w-3.5 h-3.5 object-contain', !l.isActive && 'grayscale')} loading="lazy" />
                                                        : <span className="w-2 h-2 rounded-sm" style={{ background: b.color }} />}
                                                    {l.name}
                                                </motion.button>
                                                {i < Math.min(languages.length, TOKEN_LIMIT) - 1 && <span className="text-fg-subtle">,</span>}
                                            </React.Fragment>
                                        );
                                    })}
                                    {languages.length > TOKEN_LIMIT && (
                                        <span className="text-fg-subtle text-xs">, {'/* +'}{languages.length - TOKEN_LIMIT}{' */'}</span>
                                    )}
                                </div>
                            </Line>
                            <Line n={5}>
                                <span className="text-fg-subtle">];</span>
                                <span className="text-fg-subtle">{'//'}</span>
                                <span className="text-xs text-fg-muted">
                                    <span className="font-semibold text-fg">{languages.length}</span> ngôn ngữ · <span className="font-semibold text-fg">{totalFrameworks}</span> framework liên quan
                                </span>
                                <Caret />
                            </Line>
                        </div>
                    </div>
                </section>

                {/* ── Tabs lọc + tìm kiếm ── */}
                <div className="mt-6 flex flex-col md:flex-row md:items-end gap-3 border-b border-line">
                    <div role="tablist" aria-label="Lọc ngôn ngữ" className="flex items-center gap-1 -mb-px overflow-x-auto">
                        {tabs.map(tab => {
                            const active = filter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => { setFilter(tab.id); setPage(1); }}
                                    className={cn(
                                        'relative px-3 py-2.5 font-mono text-xs font-semibold whitespace-nowrap transition-colors',
                                        active ? 'text-fg' : 'text-fg-muted hover:text-fg',
                                    )}
                                >
                                    {tab.label}
                                    <span className={cn('ml-1.5 tabular-nums', active ? 'text-primary-600 dark:text-primary-300' : 'text-fg-subtle')}>[{counts[tab.id]}]</span>
                                    {active && (
                                        <motion.span
                                            layoutId="lang-filter-tab"
                                            className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                                            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative md:ml-auto md:w-80 pb-3 md:pb-2">
                        <span className="absolute left-3 top-[calc(50%-6px)] md:top-[calc(50%-4px)] -translate-y-1/2 font-mono text-xs font-bold text-primary-600 dark:text-primary-300 select-none" aria-hidden>$</span>
                        <input
                            type="text"
                            placeholder="tìm theo tên hoặc slug…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            aria-label="Tìm ngôn ngữ"
                            className="w-full pl-8 pr-3 py-2 bg-surface-2/60 border border-line rounded-lg font-mono text-xs text-fg placeholder:text-fg-subtle focus:border-primary-400 focus:bg-surface focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* ── Đếm ── */}
                <div className="mt-3 mb-4 flex justify-between items-center font-mono text-xs text-fg-muted">
                    <div>
                        <span className="text-fg-subtle">{'//'}</span> hiển thị <span className="font-semibold text-fg">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span>–<span className="font-semibold text-fg">{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-fg">{filtered.length}</span> ngôn ngữ
                        {searchQuery && <span className="text-fg-subtle"> · khớp "{searchQuery}"</span>}
                    </div>
                    {loading && (
                        <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-300 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-current rounded-full" />
                            đang tải…
                        </div>
                    )}
                </div>

                {/* ── Danh sách / lưới ── */}
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {paginated.length > 0 ? (
                        /* Không dùng AnimatePresence mode="wait" (React 19 có thể kẹt exit → không mount view mới) */
                        <>
                            {view === 'grid' ? (
                                <motion.div key="grid" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {paginated.map(lang => (
                                        <LanguageCard key={lang.id} language={lang} onEdit={(l) => setModal({ open: true, language: l })} onDelete={handleDelete} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                                    className="rounded-xl border border-line bg-surface shadow-card overflow-hidden">
                                    {/* Hàng tiêu đề kiểu chú thích */}
                                    <div className={cn('hidden md:grid items-center gap-x-3 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle bg-surface-2/60 border-b border-line', LANGUAGE_ROW_COLS)}>
                                        <span className="text-right pr-1">#</span>
                                        <span>ngôn ngữ</span>
                                        <span>frameworks</span>
                                        <span>active</span>
                                        <span>tạo lúc</span>
                                        <span />
                                    </div>
                                    <div className="divide-y divide-line-2">
                                        {paginated.map((lang, i) => (
                                            <LanguageListItem
                                                key={lang.id}
                                                language={lang}
                                                index={(page - 1) * PAGE_SIZE + i}
                                                onEdit={(l) => setModal({ open: true, language: l })}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </>
                    ) : (
                        !loading && (
                            <div className="rounded-xl border-2 border-dashed border-line bg-surface shadow-card px-6 py-10 font-mono text-sm">
                                <div className="text-fg-subtle">{'/**'}</div>
                                <div className="pl-3 text-fg font-semibold"><span className="text-fg-subtle">* </span>Không tìm thấy ngôn ngữ nào</div>
                                <div className="pl-3 text-fg-muted"><span className="text-fg-subtle">* </span>Thử đổi từ khóa, bỏ lọc hoặc thêm mới</div>
                                <div className="text-fg-subtle">{'*/'} <Caret /></div>
                            </div>
                        )
                    )}
                </div>

                {/* ── Phân trang ── */}
                {filtered.length > PAGE_SIZE && (
                    <div className="flex justify-between items-center mt-8 pt-5 border-t border-line font-mono text-xs text-fg-muted">
                        <div>
                            <span className="text-fg-subtle">{'//'}</span> trang <span className="font-semibold text-fg">{page}</span> / {totalPages}
                        </div>
                        <div className="flex gap-1.5">
                            {([['prev', ChevronLeft, page === 1, () => setPage(p => p - 1)], ['next', ChevronRight, page === totalPages, () => setPage(p => p + 1)]] as const).map(([k, Icon, disabled, go]) => (
                                <button
                                    key={k}
                                    onClick={go}
                                    disabled={disabled || loading}
                                    aria-label={k === 'prev' ? 'Trang trước' : 'Trang sau'}
                                    className="w-8 h-8 rounded-md border border-line bg-surface text-fg-muted shadow-[0_2px_0_rgb(var(--line))] hover:text-fg hover:border-fg-subtle active:translate-y-px active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_2px_0_rgb(var(--line))] transition-all flex items-center justify-center"
                                >
                                    <Icon size={15} />
                                </button>
                            ))}
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
