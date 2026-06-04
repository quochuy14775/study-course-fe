import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bookmark, BookmarkCheck, BookOpen, Clock, PlayCircle,
    User, Eye, ThumbsUp, Star, ArrowRight,
    Search, Inbox,
} from 'lucide-react';
import courseService from '../services/courseServices';
import { Course, formatDurationSeconds } from '../types/course';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
    id: number;
    title: string;
    excerpt: string;
    author: string;
    date: string;
    category: string;
    readTime: number;
    views: number;
    likes: number;
    image: string;
}

type FilterTab = 'all' | 'courses' | 'articles';

// ── Mock articles (mirror ArticlesPage data) ──────────────────────────────────

const ARTICLES: Article[] = [
    { id: 1, title: 'React Hooks: Một hướng dẫn hoàn chỉnh', excerpt: 'Tìm hiểu về React Hooks và cách sử dụng chúng để viết các component hiệu quả hơn', author: 'John Doe', date: '15 Apr 2024', category: 'React', readTime: 8, views: 2500, likes: 340, image: '📘' },
    { id: 2, title: 'TypeScript Best Practices', excerpt: 'Những thực tiễn tốt nhất để viết mã TypeScript sạch và an toàn', author: 'Jane Smith', date: '12 Apr 2024', category: 'TypeScript', readTime: 10, views: 1850, likes: 280, image: '📕' },
    { id: 3, title: 'CSS Grid vs Flexbox: Khi nào dùng cái nào?', excerpt: 'So sánh CSS Grid và Flexbox, hiểu rõ khi nào nên sử dụng mỗi cái', author: 'Mike Johnson', date: '10 Apr 2024', category: 'CSS', readTime: 6, views: 3200, likes: 450, image: '📗' },
    { id: 4, title: 'State Management trong React', excerpt: 'So sánh Context API, Redux, Zustand và các giải pháp state management khác', author: 'Sarah Williams', date: '8 Apr 2024', category: 'React', readTime: 12, views: 2100, likes: 320, image: '📙' },
    { id: 5, title: 'Web Performance Optimization', excerpt: 'Những kỹ thuật để tối ưu hóa hiệu suất website của bạn', author: 'John Doe', date: '5 Apr 2024', category: 'Performance', readTime: 11, views: 1600, likes: 220, image: '📘' },
    { id: 6, title: 'Docker cho Developers', excerpt: 'Hướng dẫn sử dụng Docker để containerize ứng dụng của bạn', author: 'Jane Smith', date: '2 Apr 2024', category: 'DevOps', readTime: 9, views: 1400, likes: 180, image: '📕' },
];

const CATEGORY_COLOR: Record<string, string> = {
    React:       'bg-blue-50 text-blue-700 border-blue-200',
    TypeScript:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    CSS:         'bg-purple-50 text-purple-700 border-purple-200',
    Performance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DevOps:      'bg-orange-50 text-orange-700 border-orange-200',
};

const LEVEL_CONFIG: Record<string, { label: string; className: string }> = {
    Beginner:     { label: 'Cơ bản',    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    Intermediate: { label: 'Trung cấp', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    Advanced:     { label: 'Nâng cao',  className: 'bg-primary-50 text-primary-700 border border-primary-200' },
};

const GRADIENTS = [
    ['#4f46e5', '#7c3aed'], ['#7c3aed', '#6366f1'], ['#10b981', '#0d9488'],
    ['#f43f5e', '#ec4899'], ['#f59e0b', '#f97316'], ['#06b6d4', '#3b82f6'],
];

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_COURSES  = 'saved-course-ids';
const LS_ARTICLES = 'saved-article-ids';

const loadIds = (key: string, fallback: number[]): number[] => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
};

const saveIds = (key: string, ids: number[]) => {
    localStorage.setItem(key, JSON.stringify(ids));
};

// ── Animation variants ────────────────────────────────────────────────────────

const container: Variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
    exit:   { opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.22 } },
};

// ── Saved Course Card ─────────────────────────────────────────────────────────

const SavedCourseCard: React.FC<{
    course: Course;
    onUnsave: (id: number) => void;
}> = ({ course, onUnsave }) => {
    const navigate = useNavigate();
    const [from, to] = GRADIENTS[course.id % GRADIENTS.length];
    const levelCfg = LEVEL_CONFIG[course.level] ?? LEVEL_CONFIG.Beginner;

    return (
        <motion.div
            layout
            variants={itemVariant}
            initial="hidden" animate="show" exit="exit"
            whileHover={{ y: -4, boxShadow: '0 16px 40px rgb(79 70 229 / 0.12)' }}
            className="group bg-white border border-ink-200 rounded-2xl overflow-hidden flex flex-col shadow-soft transition-shadow duration-300"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] flex-shrink-0 overflow-hidden">
                {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${from},${to})` }} />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '20px 20px' }} />
                        <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white/20 select-none">
                            {course.title.charAt(0)}
                        </span>
                    </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Unsave button */}
                <button
                    onClick={() => onUnsave(course.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/80 transition-all duration-200"
                    title="Bỏ lưu"
                >
                    <BookmarkCheck className="w-4 h-4 text-white" />
                </button>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-4 gap-2.5">
                <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelCfg.className}`}>
                    {levelCfg.label}
                </span>
                <h3 className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug">{course.title}</h3>
                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

                <div className="flex items-center gap-3 text-[11px] text-ink-400">
                    {course.totalDurationSeconds > 0 && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDurationSeconds(course.totalDurationSeconds)}</span>
                    )}
                    {course.lessonCount > 0 && (
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} bài</span>
                    )}
                    <span className="ml-auto flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-ink-700">{course.rating.toFixed(1)}</span>
                    </span>
                </div>

                <div className="h-px bg-ink-100" />

                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-ink-900">
                        {course.price === 0 ? <span className="text-emerald-600">Miễn phí</span> : `${course.price.toLocaleString('vi-VN')}₫`}
                    </span>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/courses/${course.id}/learn`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:brightness-105 transition-all"
                    >
                        <PlayCircle className="w-3.5 h-3.5" /> Học ngay
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Saved Article Card ────────────────────────────────────────────────────────

const SavedArticleCard: React.FC<{
    article: Article;
    onUnsave: (id: number) => void;
}> = ({ article, onUnsave }) => {
    const catCls = CATEGORY_COLOR[article.category] ?? 'bg-ink-50 text-ink-700 border-ink-200';

    return (
        <motion.div
            layout
            variants={itemVariant}
            initial="hidden" animate="show" exit="exit"
            whileHover={{ y: -4, boxShadow: '0 16px 40px rgb(79 70 229 / 0.10)' }}
            className="group bg-white border border-ink-200 rounded-2xl overflow-hidden flex flex-col shadow-soft transition-shadow duration-300"
        >
            {/* Cover */}
            <div className="relative h-32 bg-gradient-to-br from-ink-50 to-primary-50/40 flex items-center justify-center flex-shrink-0">
                <span className="text-5xl select-none">{article.image}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />

                {/* Unsave button */}
                <button
                    onClick={() => onUnsave(article.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-ink-100 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:border-rose-200 transition-all duration-200"
                    title="Bỏ lưu"
                >
                    <BookmarkCheck className="w-4 h-4 text-rose-500" />
                </button>

                {/* Category */}
                <span className={`absolute bottom-2.5 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catCls}`}>
                    {article.category}
                </span>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-4 gap-2">
                <h3 className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug">{article.title}</h3>
                <p className="text-xs text-ink-500 line-clamp-3 leading-relaxed flex-1">{article.excerpt}</p>

                <div className="flex items-center gap-3 text-[11px] text-ink-400 mt-auto pt-2 border-t border-ink-50">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} phút</span>
                    <span className="ml-auto flex items-center gap-1">
                        <Eye className="w-3 h-3" />{article.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                        <ThumbsUp className="w-3 h-3" />{article.likes}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const SavedPage: React.FC = () => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [savedCourseIds, setSavedCourseIds]   = useState<number[]>(() => loadIds(LS_COURSES,  [1, 2, 3]));
    const [savedArticleIds, setSavedArticleIds] = useState<number[]>(() => loadIds(LS_ARTICLES, [1, 3, 5]));
    const [tab, setTab]   = useState<FilterTab>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        courseService.getCourses({ count: true, top: 50 })
            .then((res) => setAllCourses(res.value ?? []))
            .finally(() => setLoadingCourses(false));
    }, []);

    // Persist to localStorage whenever ids change
    useEffect(() => { saveIds(LS_COURSES,  savedCourseIds);  }, [savedCourseIds]);
    useEffect(() => { saveIds(LS_ARTICLES, savedArticleIds); }, [savedArticleIds]);

    const unsaveCourse  = useCallback((id: number) => setSavedCourseIds((p) => p.filter((x) => x !== id)), []);
    const unsaveArticle = useCallback((id: number) => setSavedArticleIds((p) => p.filter((x) => x !== id)), []);

    const savedCourses  = useMemo(() => allCourses.filter((c) => savedCourseIds.includes(c.id)), [allCourses, savedCourseIds]);
    const savedArticles = useMemo(() => ARTICLES.filter((a) => savedArticleIds.includes(a.id)), [savedArticleIds]);

    // Filtered by tab + search
    const filteredCourses = useMemo(() => {
        if (tab === 'articles') return [];
        const q = search.toLowerCase();
        return q ? savedCourses.filter((c) => c.title.toLowerCase().includes(q)) : savedCourses;
    }, [savedCourses, tab, search]);

    const filteredArticles = useMemo(() => {
        if (tab === 'courses') return [];
        const q = search.toLowerCase();
        return q ? savedArticles.filter((a) => a.title.toLowerCase().includes(q)) : savedArticles;
    }, [savedArticles, tab, search]);

    const totalSaved = savedCourseIds.length + savedArticleIds.length;
    const totalFiltered = filteredCourses.length + filteredArticles.length;
    const isEmpty = !loadingCourses && totalFiltered === 0;

    const TABS = [
        { key: 'all'      as FilterTab, label: 'Tất cả',   count: totalSaved },
        { key: 'courses'  as FilterTab, label: 'Khóa học', count: savedCourseIds.length },
        { key: 'articles' as FilterTab, label: 'Bài viết', count: savedArticleIds.length },
    ];

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">

            {/* ── Background (PersonalPage style) ── */}
            <motion.div
                className="absolute inset-0 bg-gradient-mesh pointer-events-none"
                style={{ backgroundSize: '180% 180%' }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <motion.div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }} />
            <motion.div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }} />
            <motion.div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-code-400/15 blur-3xl pointer-events-none"
                animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }} />

            <motion.div
                variants={container} initial="hidden" animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8"
            >
                {/* ── Header ── */}
                <motion.section variants={itemVariant}>
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>saved</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <motion.h1
                                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                                style={{ backgroundSize: '200% auto' }}
                                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                                transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                            >
                                Đã lưu
                            </motion.h1>
                            <p className="text-sm text-ink-500 mt-1">
                                {totalSaved > 0
                                    ? `${totalSaved} mục đã lưu — khóa học & bài viết`
                                    : 'Lưu khóa học và bài viết yêu thích để xem lại sau'}
                            </p>
                        </div>
                        {totalSaved > 0 && (
                            <div className="flex items-center gap-2 text-xs text-ink-500 bg-white border border-ink-200 rounded-2xl px-4 py-2.5 shadow-soft">
                                <Bookmark className="w-3.5 h-3.5 text-primary-500" />
                                <span><span className="font-bold text-ink-900">{savedCourseIds.length}</span> khóa học</span>
                                <span className="text-ink-300">·</span>
                                <span><span className="font-bold text-ink-900">{savedArticleIds.length}</span> bài viết</span>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ── Filter + Search ── */}
                <motion.div variants={itemVariant} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-white border border-ink-200 rounded-2xl shadow-soft flex-shrink-0">
                        {TABS.map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                    tab === key
                                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm'
                                        : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                                }`}
                            >
                                {label}
                                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    tab === key ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm trong danh sách đã lưu..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-2xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 shadow-soft transition-all"
                        />
                    </div>
                </motion.div>

                {/* ── Content ── */}
                {isEmpty ? (
                    <motion.div
                        variants={itemVariant}
                        className="bg-white border border-dashed border-ink-300 rounded-3xl py-24 flex flex-col items-center gap-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                            <Inbox className="w-8 h-8 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-ink-700">
                                {search ? 'Không tìm thấy kết quả' : 'Chưa có gì được lưu'}
                            </p>
                            <p className="text-sm text-ink-400 mt-1">
                                {search ? 'Thử từ khóa khác' : 'Nhấn icon bookmark trên khóa học hoặc bài viết để lưu lại'}
                            </p>
                        </div>
                        {!search && (
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => window.location.href = '/'}
                                className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl shadow-glow-primary"
                            >
                                Khám phá khóa học <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Courses section */}
                        <AnimatePresence>
                            {filteredCourses.length > 0 && (
                                <motion.section
                                    key="courses-section"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    {tab === 'all' && (
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary-500 to-accent-500 flex-shrink-0" />
                                            <h2 className="text-base font-bold text-ink-900">Khóa học đã lưu</h2>
                                            <span className="text-xs font-mono text-ink-400">{filteredCourses.length}</span>
                                        </div>
                                    )}
                                    <motion.div
                                        layout
                                        variants={container} initial="hidden" animate="show"
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                                    >
                                        <AnimatePresence>
                                            {filteredCourses.map((c) => (
                                                <SavedCourseCard key={c.id} course={c} onUnsave={unsaveCourse} />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Articles section */}
                        <AnimatePresence>
                            {filteredArticles.length > 0 && (
                                <motion.section
                                    key="articles-section"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    {tab === 'all' && (
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500 flex-shrink-0" />
                                            <h2 className="text-base font-bold text-ink-900">Bài viết đã lưu</h2>
                                            <span className="text-xs font-mono text-ink-400">{filteredArticles.length}</span>
                                        </div>
                                    )}
                                    <motion.div
                                        layout
                                        variants={container} initial="hidden" animate="show"
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                                    >
                                        <AnimatePresence>
                                            {filteredArticles.map((a) => (
                                                <SavedArticleCard key={a.id} article={a} onUnsave={unsaveArticle} />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </main>
    );
};

export default SavedPage;
