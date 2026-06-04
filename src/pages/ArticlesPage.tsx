import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Clock, User, Eye, ThumbsUp, Search, BookOpen, TrendingUp, ArrowRight, Bookmark, X, PenLine, Pencil, Trash2 } from 'lucide-react';
import articleService from '../services/articleService';
import type { Article } from '../types/article';
import ArticleFormModal from '../components/ArticleFormModal';
import ArticleDetailModal from '../components/ArticleDetailModal';
import { useAuthStore } from '../stores/authStore';
import { showToast } from '../components/CustomToast';

// ── Category style map ────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { chip: string; badge: string }> = {
    React:       { chip: 'bg-blue-50 text-blue-700 border-blue-200',       badge: 'bg-blue-100 text-blue-700' },
    TypeScript:  { chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
    CSS:         { chip: 'bg-purple-50 text-purple-700 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
    Performance: { chip: 'bg-amber-50 text-amber-700 border-amber-200',    badge: 'bg-amber-100 text-amber-700' },
    DevOps:      { chip: 'bg-orange-50 text-orange-700 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    Backend:     { chip: 'bg-teal-50 text-teal-700 border-teal-200',       badge: 'bg-teal-100 text-teal-700' },
    Trends:      { chip: 'bg-rose-50 text-rose-700 border-rose-200',       badge: 'bg-rose-100 text-rose-700' },
    Frontend:    { chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',       badge: 'bg-cyan-100 text-cyan-700' },
};

const getCategoryStyle = (cat?: string | null) =>
    CATEGORY_STYLE[cat ?? ''] ?? { chip: 'bg-ink-50 text-ink-600 border-ink-200', badge: 'bg-ink-100 text-ink-600' };

// Fallback emoji khi không có thumbnail
const EMOJI_FALLBACKS = ['📘','📕','📗','📙','📓','📔','📒'];
const emojiFor = (id: number) => EMOJI_FALLBACKS[id % EMOJI_FALLBACKS.length];

// ── Animation variants ────────────────────────────────────────────────────────

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemV: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden shadow-soft">
        <div className="h-40 bg-ink-100 animate-pulse" />
        <div className="p-4 space-y-2.5">
            <div className="h-4 w-3/4 rounded bg-ink-100 animate-pulse" />
            <div className="h-3 w-full rounded bg-ink-100 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-ink-100 animate-pulse" />
        </div>
    </div>
);

// ── Featured card ─────────────────────────────────────────────────────────────

const FeaturedCard: React.FC<{ article: Article; onClick?: () => void }> = ({ article, onClick }) => {
    const [saved, setSaved] = useState(false);
    const style = getCategoryStyle(article.category);

    return (
        <motion.article
            variants={itemV}
            whileHover={{ y: -4, boxShadow: '0 24px 56px rgb(79 70 229 / 0.13)' }}
            className="group relative bg-white border border-ink-200 rounded-3xl overflow-hidden shadow-soft transition-shadow duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex flex-col md:flex-row">
                {/* Cover */}
                <div className="md:w-2/5 relative h-52 md:h-auto bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {article.thumbnailUrl ? (
                        <img src={article.thumbnailUrl} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <>
                            <motion.div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary-200/50 blur-2xl"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
                            <motion.div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-accent-200/50 blur-2xl"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
                            <motion.span className="relative text-7xl select-none"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                                {emojiFor(article.id)}
                            </motion.span>
                        </>
                    )}

                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-primary-200 shadow-sm">
                        <TrendingUp size={11} className="text-primary-600" />
                        <span className="text-[10px] font-bold text-primary-700">NỔI BẬT</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4">
                        {article.category && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${style.chip}`}>
                                {article.category}
                            </span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
                            className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-primary-600 bg-primary-50' : 'text-ink-400 hover:text-ink-700 hover:bg-ink-50'}`}>
                            <Bookmark size={15} className={saved ? 'fill-primary-600' : ''} />
                        </button>
                    </div>

                    <h2 className="text-xl font-extrabold text-ink-900 leading-snug mb-3 group-hover:text-primary-700 transition-colors line-clamp-2">
                        {article.title}
                    </h2>
                    {article.excerpt && (
                        <p className="text-sm text-ink-500 leading-relaxed flex-1 line-clamp-3">{article.excerpt}</p>
                    )}

                    <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 text-xs text-ink-400">
                            {article.author && (
                                <span className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                        <User size={10} className="text-primary-600" />
                                    </div>
                                    <span className="font-medium text-ink-600">{article.author}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1"><Clock size={11} />{article.readTimeMinutes} phút đọc</span>
                            <span className="hidden sm:flex items-center gap-1"><Eye size={11} />{article.viewCount.toLocaleString()}</span>
                        </div>
                        <motion.div whileHover={{ x: 4 }} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                            Đọc ngay <ArrowRight size={13} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

// ── Regular card ──────────────────────────────────────────────────────────────

const ArticleCard: React.FC<{
    article: Article;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onClick?: () => void;
}> = ({ article, isOwner, onEdit, onDelete, onClick }) => {
    const [saved, setSaved] = useState(false);
    const style = getCategoryStyle(article.category);

    return (
        <motion.article
            variants={itemV}
            whileHover={{ y: -5, boxShadow: '0 18px 44px rgb(79 70 229 / 0.11)' }}
            className="group bg-white border border-ink-200 rounded-2xl overflow-hidden shadow-soft flex flex-col cursor-pointer transition-shadow duration-300"
            onClick={onClick}
        >
            {/* Cover */}
            <div className="relative h-40 bg-gradient-to-br from-ink-50 to-primary-50/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                {article.thumbnailUrl ? (
                    <img src={article.thumbnailUrl} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <motion.span className="text-5xl select-none"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4 + (article.id % 3) * 0.5, repeat: Infinity, ease: 'easeInOut' }}>
                        {emojiFor(article.id)}
                    </motion.span>
                )}

                {/* Actions: save + owner edit/delete */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isOwner && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                                className="w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                                <Pencil size={11} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                className="w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                                <Trash2 size={11} />
                            </button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            saved ? 'bg-primary-600 text-white' : 'bg-white/80 backdrop-blur-sm text-ink-500 hover:text-primary-600'
                        }`}>
                        <Bookmark size={13} className={saved ? 'fill-white' : ''} />
                    </button>
                </div>

                {article.category && (
                    <span className={`absolute bottom-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                        {article.category}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4 gap-2">
                <h3 className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug group-hover:text-primary-700 transition-colors">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed flex-1">{article.excerpt}</p>
                )}

                <div className="pt-3 mt-auto border-t border-ink-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-ink-400">
                        {article.author && (
                            <span className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-primary-50 flex items-center justify-center">
                                    <User size={8} className="text-primary-500" />
                                </div>
                                <span className="font-medium text-ink-600 truncate max-w-[72px]">{article.author}</span>
                            </span>
                        )}
                        <span className="flex items-center gap-1"><Clock size={10} />{article.readTimeMinutes}p</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-ink-400">
                        <span className="flex items-center gap-1"><Eye size={10} />{article.viewCount > 999 ? `${(article.viewCount/1000).toFixed(1)}k` : article.viewCount}</span>
                        <span className="flex items-center gap-1 text-rose-400"><ThumbsUp size={10} />{article.likeCount}</span>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const ArticlesPage: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const [articles, setArticles]             = useState<Article[]>([]);
    const [categories, setCategories]         = useState<string[]>([]);
    const [loading, setLoading]               = useState(true);
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [search, setSearch]                 = useState('');
    const [formOpen, setFormOpen]             = useState(false);
    const [editTarget, setEditTarget]         = useState<Article | null>(null);
    const [detailId, setDetailId]             = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [arts, cats] = await Promise.all([
                articleService.getArticles(),
                articleService.getCategories(),
            ]);
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
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev];
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

    const openEdit = (article: Article) => { setEditTarget(article); setFormOpen(true); };
    const openCreate = () => { setEditTarget(null); setFormOpen(true); };

    const featured = useMemo(() => articles.find((a) => a.isFeatured), [articles]);

    const filtered = useMemo(() => {
        let list = articles.filter((a) => !a.isFeatured);
        if (activeCategory !== 'Tất cả') list = list.filter((a) => a.category === activeCategory);
        if (search.trim()) list = list.filter((a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            (a.excerpt ?? '').toLowerCase().includes(search.toLowerCase())
        );
        return list;
    }, [articles, activeCategory, search]);

    const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
    const allCategories = ['Tất cả', ...categories];

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            {/* Background */}
            <motion.div className="absolute inset-0 bg-gradient-mesh pointer-events-none" style={{ backgroundSize: '180% 180%' }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }} />
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <motion.div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }} />
            <motion.div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }} />

            <motion.div variants={container} initial="hidden" animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">

                {/* Header */}
                <motion.section variants={itemV}>
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>articles</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <motion.h1
                                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                                style={{ backgroundSize: '200% auto' }}
                                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                                transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                            >
                                Bài viết
                            </motion.h1>
                            <p className="text-sm text-ink-500 mt-1">Đọc các bài viết mới nhất về lập trình và công nghệ</p>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                            {!loading && (
                                <div className="flex items-center gap-4 text-xs text-ink-500 bg-white border border-ink-200 rounded-2xl px-4 py-2.5 shadow-soft">
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen size={12} className="text-primary-500" />
                                        <span><span className="font-bold text-ink-800">{articles.length}</span> bài viết</span>
                                    </span>
                                    <span className="w-px h-3 bg-ink-200" />
                                    <span className="flex items-center gap-1.5">
                                        <Eye size={12} className="text-accent-500" />
                                        <span><span className="font-bold text-ink-800">{totalViews > 999 ? `${(totalViews/1000).toFixed(0)}k` : totalViews}</span> lượt đọc</span>
                                    </span>
                                </div>
                            )}
                            {user && (
                                <motion.button
                                    onClick={openCreate}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold rounded-2xl shadow-glow-primary hover:brightness-105 transition-all"
                                >
                                    <PenLine size={14} /> Viết bài
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Featured */}
                {!loading && featured && <FeaturedCard article={featured} onClick={() => setDetailId(featured.id)} />}
                {loading && (
                    <div className="bg-white border border-ink-200 rounded-3xl h-56 animate-pulse" />
                )}

                {/* Filter + Search */}
                <motion.div variants={itemV} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 scrollbar-none">
                        {allCategories.map((cat) => {
                            const isActive = cat === activeCategory;
                            const style = CATEGORY_STYLE[cat];
                            return (
                                <button key={cat} onClick={() => setActiveCategory(cat)}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                        isActive
                                            ? cat === 'Tất cả'
                                                ? 'bg-ink-900 border-ink-900 text-white shadow-sm scale-105'
                                                : `${style?.chip ?? 'bg-primary-50 text-primary-700 border-primary-200'} scale-105 shadow-sm`
                                            : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                                    }`}>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full sm:w-56 flex-shrink-0">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm bài viết..."
                            className="w-full pl-9 pr-8 py-2 bg-white border border-ink-200 rounded-full text-xs text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 shadow-soft transition-all" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {filtered.length === 0 ? (
                            <motion.div key="empty"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="py-20 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-3">
                                    <Search size={22} className="text-ink-300" />
                                </div>
                                <p className="text-sm font-semibold text-ink-600">Không tìm thấy bài viết</p>
                                <p className="text-xs text-ink-400 mt-1">Thử danh mục hoặc từ khóa khác</p>
                            </motion.div>
                        ) : (
                            <motion.div key={activeCategory + search}
                                variants={container} initial="hidden" animate="show"
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        isOwner={!!user && article.createdBy === user.email}
                                        onEdit={() => openEdit(article)}
                                        onDelete={() => handleDelete(article.id)}
                                        onClick={() => setDetailId(article.id)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* Load more */}
                {!loading && filtered.length > 0 && (
                    <motion.div variants={itemV} className="flex justify-center pt-2">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-ink-200 rounded-2xl text-sm font-semibold text-ink-700 shadow-soft hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all">
                            Xem thêm bài viết <ArrowRight size={14} />
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>

            <ArticleFormModal
                isOpen={formOpen}
                onClose={() => { setFormOpen(false); setEditTarget(null); }}
                onSaved={handleSaved}
                editArticle={editTarget}
            />

            <ArticleDetailModal
                articleId={detailId}
                onClose={() => setDetailId(null)}
            />
        </main>
    );
};

export default ArticlesPage;
