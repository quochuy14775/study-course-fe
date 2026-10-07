import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, Eye, ThumbsUp, Search, ArrowRight, Bookmark, PenLine, Pencil, Trash2,
    FileText, Newspaper, Star, Hash, Flame,
} from 'lucide-react';
import articleService from '../services/articleService';
import type { Article } from '../types/article';
import ArticleFormModal from '../components/ArticleFormModal';
import ArticleDetailModal from '../components/ArticleDetailModal';
import { useAuthStore } from '../stores/authStore';
import { useSaved } from '../stores/savedStore';
import { showToast } from '../components/CustomToast';
import { MacWindow } from '../components/ui/MacWindow';
import { PageTitle } from '../components/ui/PageTitle';
import { TermKey } from '../components/ui/Terminal';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Bảng tra
   ───────────────────────────────────────────────────────────── */

/** Chấm màu + chip theo danh mục, có dark. Danh mục lạ → trung tính. */
const CATEGORY_TONE: Record<string, { dot: string; chip: string }> = {
    React:       { dot: 'bg-sky-500',     chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    TypeScript:  { dot: 'bg-indigo-500',  chip: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
    CSS:         { dot: 'bg-purple-500',  chip: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
    Performance: { dot: 'bg-amber-500',   chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    DevOps:      { dot: 'bg-orange-500',  chip: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
    Backend:     { dot: 'bg-teal-500',    chip: 'bg-teal-500/10 text-teal-700 dark:text-teal-300' },
    Trends:      { dot: 'bg-rose-500',    chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
    Frontend:    { dot: 'bg-cyan-500',    chip: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
};
const toneOf = (cat?: string | null) => CATEGORY_TONE[cat ?? ''] ?? { dot: 'bg-fg-subtle', chip: 'bg-surface-2 text-fg-muted' };

const ALL = 'Tất cả';
const EASE = [0.16, 1, 0.3, 1] as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const compact = (n: number) => (n > 999 ? `${(n / 1000).toFixed(n > 9999 ? 0 : 1)}k` : String(n));

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

const ArticlesPage: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const [articles, setArticles]     = useState<Article[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading]       = useState(true);
    const [category, setCategory]     = useState(ALL);
    const [query, setQuery]           = useState('');
    const [formOpen, setFormOpen]     = useState(false);
    const [editTarget, setEditTarget] = useState<Article | null>(null);
    const [detailId, setDetailId]     = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [arts, cats] = await Promise.all([articleService.getArticles(), articleService.getCategories()]);
            setArticles(arts);
            setCategories(cats);
        } catch {
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaved = (saved: Article) => {
        setArticles((prev) => {
            const idx = prev.findIndex((a) => a.id === saved.id);
            if (idx < 0) return [saved, ...prev];
            const next = [...prev]; next[idx] = saved; return next;
        });
    };
    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
        try {
            await articleService.deleteArticle(id);
            setArticles((prev) => prev.filter((a) => a.id !== id));
            showToast.success('Đã xóa bài viết');
        } catch {
            showToast.error('Xóa thất bại');
        }
    };
    const openEdit = (a: Article) => { setEditTarget(a); setFormOpen(true); };
    const openCreate = () => { setEditTarget(null); setFormOpen(true); };

    // Chỉ một bài lên README; các bài isFeatured khác vẫn nằm trong danh sách, không bị "nuốt".
    const featured = useMemo(() => articles.find((a) => a.isFeatured), [articles]);
    const listed = useMemo(() => articles.filter((a) => a.id !== featured?.id), [articles, featured]);
    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => listed.filter((a) =>
        (category === ALL || a.category === category) &&
        (!q || a.title.toLowerCase().includes(q) || (a.excerpt ?? '').toLowerCase().includes(q)),
    ), [listed, category, q]);

    const countOf = (cat: string) => listed.filter((a) => cat === ALL || a.category === cat).length;
    const popular = useMemo(() => [...listed].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3), [listed]);
    const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
    const folders = [ALL, ...categories];

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                <PageTitle
                    path="articles"
                    title="Bài viết"
                    subtitle="Đọc các bài viết mới nhất về lập trình và công nghệ"
                    right={user && (
                        <Button size="sm" onClick={openCreate}><PenLine className="w-3.5 h-3.5" /> Viết bài</Button>
                    )}
                />

                {(loading || featured) && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                        {loading
                            ? <div className="h-48 rounded-xl shimmer" />
                            : featured && (
                                <FeaturedWindow
                                    article={featured}
                                    onOpen={() => setDetailId(featured.id)}
                                    isOwner={!!user && featured.createdBy === user.email}
                                    onEdit={() => openEdit(featured)}
                                    onDelete={() => handleDelete(featured.id)}
                                />
                            )}
                    </motion.div>
                )}

                {/* ── Feed blog + sidebar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08, ease: EASE }}
                    className="grid lg:grid-cols-[1fr_16rem] gap-6 lg:gap-8 items-start"
                >
                    <section className="min-w-0">
                        {/* Đầu feed: comment mono + tìm kiếm (mobile) */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
                            <p className="font-mono text-[12px] text-fg-muted">
                                <span className="text-fg-subtle select-none">{'// '}</span>
                                {category === ALL ? 'tất cả bài viết' : category}
                                <span className="text-fg-subtle"> — {filtered.length} bài</span>
                                {!loading && <span className="hidden sm:inline text-fg-subtle"> · {compact(totalViews)} lượt đọc</span>}
                            </p>
                            <label className="relative ml-auto lg:hidden">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle pointer-events-none" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Tìm bài viết…"
                                    aria-label="Tìm bài viết"
                                    className="h-8 w-40 pl-7 pr-2 rounded-md border border-line bg-surface font-mono text-[11.5px] text-fg placeholder:text-fg-subtle outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-[border-color,box-shadow]"
                                />
                            </label>
                        </div>

                        {/* Chuyên mục dạng chip trên màn hẹp (sidebar ẩn) */}
                        <div className="lg:hidden flex gap-1.5 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {folders.map((cat) => (
                                <button key={cat} onClick={() => setCategory(cat)}
                                    className={cn('h-7 px-2.5 rounded-md border text-[12px] whitespace-nowrap transition-colors',
                                        category === cat ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line text-fg-muted')}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonPost key={i} />)}</div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-line">
                                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-subtle mb-3"><Newspaper className="w-5 h-5" /></div>
                                <p className="text-sm font-medium text-fg-2">{q ? 'Không có bài nào khớp' : 'Chưa có bài viết'}</p>
                                <p className="font-mono text-[11px] text-fg-subtle mt-1">{q ? <>{'// '}thử từ khóa khác</> : <>{'// '}chuyên mục này chưa có bài</>}</p>
                            </div>
                        ) : (
                            <motion.div
                                key={`${category}-${q}`}
                                className="space-y-4"
                                variants={feedVariants}
                                initial="hidden"
                                animate="show"
                            >
                                {filtered.map((a) => (
                                    <ArticlePost
                                        key={a.id}
                                        article={a}
                                        isOwner={!!user && a.createdBy === user.email}
                                        onOpen={() => setDetailId(a.id)}
                                        onEdit={() => openEdit(a)}
                                        onDelete={() => handleDelete(a.id)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </section>

                    {/* Sidebar blog — dính khi cuộn */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-5">
                            <label className="relative block">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle pointer-events-none" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Tìm bài viết…"
                                    aria-label="Tìm bài viết"
                                    className="h-9 w-full pl-8 pr-2 rounded-lg border border-line bg-surface font-mono text-[12px] text-fg placeholder:text-fg-subtle outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-[border-color,box-shadow]"
                                />
                            </label>

                            <div className="rounded-2xl border border-line bg-surface shadow-card p-3">
                                <p className="px-2 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Chuyên mục</p>
                                <div className="flex flex-col gap-0.5">
                                    {folders.map((cat) => {
                                        const active = category === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                aria-pressed={active}
                                                className={cn('relative flex items-center gap-2 h-8 px-2 rounded-md text-[12.5px] text-left transition-colors',
                                                    active ? 'text-primary-700 dark:text-primary-200 font-medium' : 'text-fg-2 hover:bg-surface-2')}
                                            >
                                                {active && <motion.span layoutId="articles-side-active" className="absolute inset-0 rounded-md bg-primary-500/15" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                                                {cat === ALL
                                                    ? <Hash className="relative w-3.5 h-3.5 text-fg-subtle" />
                                                    : <span className={cn('relative w-2 h-2 rounded-full', toneOf(cat).dot)} />}
                                                <span className="relative flex-1 truncate">{cat}</span>
                                                <span className="relative font-mono text-[10.5px] text-fg-subtle tabular-nums">{countOf(cat)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {popular.length > 0 && (
                                <div className="rounded-2xl border border-line bg-surface shadow-card p-3">
                                    <p className="px-2 mb-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-fg-subtle"><Flame className="w-3 h-3 text-orange-500" /> Đọc nhiều</p>
                                    <ol className="flex flex-col">
                                        {popular.map((a, i) => (
                                            <li key={a.id}>
                                                <button onClick={() => setDetailId(a.id)} className="group flex items-start gap-2.5 w-full px-2 py-2 rounded-md text-left hover:bg-surface-2 transition-colors">
                                                    <span className="font-mono text-[11px] text-fg-subtle tabular-nums pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                                    <span className="min-w-0">
                                                        <span className="block text-[12.5px] font-medium text-fg leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{a.title}</span>
                                                        <span className="mt-0.5 flex items-center gap-1 font-mono text-[10.5px] text-fg-subtle"><Eye className="w-3 h-3" />{compact(a.viewCount)}</span>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    </aside>
                </motion.div>
            </div>

            <ArticleFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} onSaved={handleSaved} editArticle={editTarget} />
            <ArticleDetailModal articleId={detailId} onClose={() => setDetailId(null)} />
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   README.md — bài nổi bật
   ───────────────────────────────────────────────────────────── */

const FeaturedWindow: React.FC<{ article: Article; isOwner: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void }> = ({ article, isOwner, onOpen, onEdit, onDelete }) => {
    const { isArticleSaved, toggleArticle } = useSaved();
    const saved = isArticleSaved(article.id);
    const tone = toneOf(article.category);

    return (
        <MacWindow
            title={<><FileText className="w-3.5 h-3.5 text-fg-muted" /> README.md — {article.slug}</>}
            right={<RowActions saved={saved} onSave={() => toggleArticle(article.id)} isOwner={isOwner} onEdit={onEdit} onDelete={onDelete} always />}
            footer={
                <>
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> nổi bật
                    {article.author && <><span className="text-fg-subtle">·</span>{article.author}</>}
                    <span className="text-fg-subtle">·</span>{fmtDate(article.createdAt)}
                    <span className="ml-auto tabular-nums">{article.readTimeMinutes} phút đọc</span>
                </>
            }
        >
            <div onClick={onOpen} className="group grid md:grid-cols-[18rem_1fr] cursor-pointer">
                <div className="relative h-44 md:h-full min-h-[11rem] bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-sky-500/15 overflow-hidden border-b md:border-b-0 md:border-r border-line">
                    {article.thumbnailUrl
                        ? <img src={article.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        : <Newspaper className="absolute inset-0 m-auto w-12 h-12 text-primary-500/40" />}
                </div>
                <div className="p-5 sm:p-6 flex flex-col">
                    <TermKey className="mb-2">featured{article.category && <> · {article.category.toLowerCase()}</>}</TermKey>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-fg leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-2">
                        {article.title}
                    </h2>
                    {article.excerpt && <p className="mt-2 text-sm text-fg-muted leading-relaxed line-clamp-3">{article.excerpt}</p>}
                    <div className="mt-auto pt-4 flex items-center gap-3 font-mono text-[11px] text-fg-muted">
                        {article.category && <span className={cn('px-1.5 h-5 inline-flex items-center rounded', tone.chip)}>{article.category}</span>}
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{compact(article.viewCount)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.likeCount}</span>
                        <span className="ml-auto flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-300 transition-transform group-hover:translate-x-0.5">
                            Đọc ngay <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   Bài trong feed — card blog: ảnh bìa trái, nội dung phải
   ───────────────────────────────────────────────────────────── */

const feedVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const postVariants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

const RowActions: React.FC<{ saved: boolean; onSave: () => void; isOwner: boolean; onEdit: () => void; onDelete: () => void; always?: boolean }> = ({ saved, onSave, isOwner, onEdit, onDelete, always }) => {
    const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
    const base = 'flex w-7 h-7 items-center justify-center rounded-md transition-all';
    const hidden = always ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100';
    return (
        <span className="flex items-center gap-0.5">
            {isOwner && (
                <>
                    <button onClick={stop(onEdit)} aria-label="Sửa bài viết" title="Sửa" className={cn(base, hidden, 'text-fg-subtle hover:text-primary-600 hover:bg-primary-500/10')}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={stop(onDelete)} aria-label="Xóa bài viết" title="Xóa" className={cn(base, hidden, 'text-fg-subtle hover:text-rose-600 hover:bg-rose-500/10')}><Trash2 className="w-3.5 h-3.5" /></button>
                </>
            )}
            <button
                onClick={stop(onSave)}
                aria-pressed={saved}
                aria-label={saved ? 'Bỏ lưu' : 'Lưu bài viết'}
                title={saved ? 'Bỏ lưu' : 'Lưu'}
                className={cn(base, saved ? 'text-primary-600 dark:text-primary-300' : cn(hidden, 'text-fg-subtle hover:text-primary-600 hover:bg-primary-500/10'))}
            >
                <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-current')} />
            </button>
        </span>
    );
};

const ArticlePost: React.FC<{ article: Article; isOwner: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void }> = ({ article, isOwner, onOpen, onEdit, onDelete }) => {
    const { isArticleSaved, toggleArticle } = useSaved();
    const tone = toneOf(article.category);
    const initial = (article.author ?? '?').trim().charAt(0).toUpperCase();

    return (
        <motion.article
            variants={postVariants}
            whileHover={{ y: -3, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
            onClick={onOpen}
            className={cn(
                'group grid sm:grid-cols-[13rem_1fr] gap-4 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-line bg-surface shadow-card cursor-pointer',
                'transition-[border-color,box-shadow] duration-300 hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40',
            )}
        >
            {/* Ảnh bìa */}
            <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[8.5rem] rounded-xl overflow-hidden bg-surface-2 ring-1 ring-line">
                {article.thumbnailUrl ? (
                    <img
                        src={article.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-sky-500/15 flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-primary-500/40" />
                    </div>
                )}
                {article.category && (
                    <span className={cn('absolute top-2 left-2 px-1.5 h-5 inline-flex items-center rounded-md font-mono text-[10.5px] font-medium backdrop-blur-sm', tone.chip)}>
                        {article.category}
                    </span>
                )}
            </div>

            {/* Nội dung */}
            <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-2 font-mono text-[11px] text-fg-muted">
                    <span className="tabular-nums">{fmtDate(article.createdAt)}</span>
                    <span className="text-fg-subtle">·</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTimeMinutes} phút đọc</span>
                    <span className="ml-auto">
                        <RowActions saved={isArticleSaved(article.id)} onSave={() => toggleArticle(article.id)} isOwner={isOwner} onEdit={onEdit} onDelete={onDelete} />
                    </span>
                </div>

                <h3 className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-fg leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                    {article.title}
                </h3>
                {article.excerpt && <p className="mt-1.5 text-sm text-fg-muted leading-relaxed line-clamp-2">{article.excerpt}</p>}

                <div className="mt-auto pt-3 flex items-center gap-3 text-[12px] text-fg-muted">
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span className="flex w-6 h-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-600 text-white text-[10px] font-bold">{initial}</span>
                        <span className="truncate font-medium text-fg-2">{article.author ?? 'Ẩn danh'}</span>
                    </span>
                    <span className="hidden sm:flex items-center gap-3 font-mono text-[11px] tabular-nums">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{compact(article.viewCount)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.likeCount}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-300 whitespace-nowrap transition-transform group-hover:translate-x-0.5">
                        Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </motion.article>
    );
};

const SkeletonPost: React.FC = () => (
    <div className="grid sm:grid-cols-[13rem_1fr] gap-4 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-line bg-surface shadow-card">
        <div className="aspect-[16/10] sm:aspect-auto sm:min-h-[8.5rem] rounded-xl shimmer" />
        <div className="space-y-3 py-1">
            <div className="h-3 w-32 rounded shimmer" />
            <div className="h-5 w-4/5 rounded shimmer" />
            <div className="h-3 w-full rounded shimmer" />
            <div className="h-3 w-2/3 rounded shimmer" />
            <div className="flex items-center gap-2 pt-2"><div className="w-6 h-6 rounded-full shimmer" /><div className="h-3 w-24 rounded shimmer" /></div>
        </div>
    </div>
);

export default ArticlesPage;
