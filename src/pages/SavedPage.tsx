import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bookmark, BookmarkX, BookOpen, Clock, Eye, ThumbsUp, User, Star, ArrowRight, Search, Inbox,
    FolderOpen, LayoutGrid, GraduationCap, Newspaper, Play, type LucideIcon,
} from 'lucide-react';
import { showToast } from '../components/CustomToast';
import courseService from '../services/courseServices';
import articleService from '../services/articleService';
import enrollmentService from '../services/enrollmentService';
import EnrollConfirmModal from '../components/EnrollConfirmModal';
import CheckoutModal from '../components/CheckoutModal';
import { useEnrollFlow } from '../hooks/useEnrollFlow';
import { useMyCourses } from '../hooks/useMyCourses';
import { useSaved } from '../stores/savedStore';
import { MacWindow } from '../components/ui/MacWindow';
import { PageTitle } from '../components/ui/PageTitle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Course, formatDurationSeconds } from '../types/course';
import type { Article } from '../types/article';
import { THUMBNAIL_GRADIENTS } from './user/course/CourseCard';
import { cn } from '../lib/cn';

type Filter = 'all' | 'courses' | 'articles';

const FILTERS: Array<{ id: Filter; label: string; icon: LucideIcon }> = [
    { id: 'all',      label: 'Tất cả',   icon: LayoutGrid },
    { id: 'courses',  label: 'Khóa học', icon: GraduationCap },
    { id: 'articles', label: 'Bài viết', icon: Newspaper },
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

const SavedPage: React.FC = () => {
    const navigate = useNavigate();
    const saved = useSaved();
    const enrolled = useMyCourses();
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');

    const [courses, setCourses] = useState<Course[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(saved.courses.length + saved.articles.length > 0);

    // Chỉ gọi API khi có gì để hiện; danh sách trống thì không tốn request.
    useEffect(() => {
        const wantCourses = saved.courses.length > 0;
        const wantArticles = saved.articles.length > 0;
        if (!wantCourses && !wantArticles) { setCourses([]); setArticles([]); setLoading(false); return; }

        let cancelled = false;
        setLoading(true);
        Promise.all([
            wantCourses ? courseService.getCourses({ top: 100 }).then((r) => r.value ?? []).catch(() => []) : Promise.resolve([] as Course[]),
            wantArticles ? articleService.getArticles().catch(() => [] as Article[]) : Promise.resolve([] as Article[]),
        ]).then(([c, a]) => {
            if (cancelled) return;
            setCourses(c);
            setArticles(a);
            setLoading(false);
        });
        return () => { cancelled = true; };
        // Chỉ refetch khi *số lượng* id đổi từ 0 ↔ >0; bỏ lưu một mục thì lọc client-side là đủ.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saved.courses.length > 0, saved.articles.length > 0]);

    const q = query.trim().toLowerCase();
    const savedCourses = useMemo(
        () => courses.filter((c) => saved.courses.includes(c.id) && (!q || c.title.toLowerCase().includes(q))),
        [courses, saved.courses, q],
    );
    const savedArticles = useMemo(
        () => articles.filter((a) => saved.articles.includes(a.id) && (!q || a.title.toLowerCase().includes(q))),
        [articles, saved.articles, q],
    );
    const showCourses = filter !== 'articles' && savedCourses.length > 0;
    const showArticles = filter !== 'courses' && savedArticles.length > 0;
    const visible = (filter !== 'articles' ? savedCourses.length : 0) + (filter !== 'courses' ? savedArticles.length : 0);
    const totalSaved = saved.courses.length + saved.articles.length;
    const current = FILTERS.find((f) => f.id === filter)!;

    // Một luồng ghi danh + một cặp modal cho cả trang thay vì mỗi dòng một bộ.
    const { pendingCourse, enrolling, requestEnroll, cancelEnroll, confirmEnroll } = useEnrollFlow();
    const [checkout, setCheckout] = useState<Course | null>(null);
    const enrollmentOf = (id: number) => enrolled.find((e) => e.courseId === id);

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
                <PageTitle
                    path="saved"
                    title="Đã lưu"
                    subtitle={totalSaved > 0 ? `${totalSaved} mục — khóa học & bài viết bạn đánh dấu` : 'Lưu khóa học và bài viết để xem lại sau'}
                />

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                    <MacWindow
                        title={<><FolderOpen className="w-3.5 h-3.5 text-primary-500" /> Đã lưu</>}
                        footer={
                            <>
                                <span className="tabular-nums">{visible} mục</span>
                                {totalSaved > 0 && <><span className="text-fg-subtle">·</span>{saved.courses.length} khóa học<span className="text-fg-subtle">·</span>{saved.articles.length} bài viết</>}
                                <span className="ml-auto text-fg-subtle">~/saved/{filter}</span>
                            </>
                        }
                    >
                        <div className="flex min-h-[24rem]">
                            <aside className="hidden md:flex w-44 flex-shrink-0 flex-col gap-0.5 p-3 border-r border-line bg-surface-2/40">
                                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Yêu thích</p>
                                {FILTERS.map((f) => {
                                    const count = f.id === 'all' ? totalSaved : f.id === 'courses' ? saved.courses.length : saved.articles.length;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id)}
                                            aria-pressed={filter === f.id}
                                            className={cn('relative flex items-center gap-2 h-8 px-2 rounded-md text-[12.5px] text-left transition-colors',
                                                filter === f.id ? 'text-primary-700 dark:text-primary-200 font-medium' : 'text-fg-2 hover:bg-surface-2')}
                                        >
                                            {filter === f.id && <motion.span layoutId="saved-side-active" className="absolute inset-0 rounded-md bg-primary-500/15" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                                            <f.icon className="relative w-3.5 h-3.5" />
                                            <span className="relative flex-1 truncate">{f.label}</span>
                                            <span className="relative font-mono text-[10.5px] text-fg-subtle tabular-nums">{count}</span>
                                        </button>
                                    );
                                })}
                            </aside>

                            <div className="min-w-0 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 px-3 sm:px-4 h-11 border-b border-line">
                                    <span className="text-sm font-semibold text-fg truncate">{current.label}</span>
                                    <span className="font-mono text-[11px] text-fg-subtle tabular-nums whitespace-nowrap">{visible} mục</span>
                                    <label className="relative ml-auto">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle pointer-events-none" />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Tìm trong đã lưu…"
                                            aria-label="Tìm trong đã lưu"
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

                                <div className="flex-1 p-3 sm:p-4 space-y-6">
                                    {loading ? (
                                        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}</div>
                                    ) : visible === 0 ? (
                                        <EmptyState hasQuery={!!q} hasAny={totalSaved > 0} onExplore={() => navigate('/')} />
                                    ) : (
                                        <>
                                            {showCourses && (
                                                <section>
                                                    <GroupHeader icon={GraduationCap} title="Khóa học" count={savedCourses.length} tone="bg-emerald-500" />
                                                    <ul className="rounded-lg border border-line divide-y divide-line-2 overflow-hidden">
                                                        {savedCourses.map((c) => (
                                                            <CourseRow
                                                                key={c.id}
                                                                course={c}
                                                                enrollment={enrollmentOf(c.id)}
                                                                onOpen={() => navigate(`/courses/${c.id}`)}
                                                                onLearn={() => navigate(`/courses/${c.id}/learn`)}
                                                                onEnroll={() => (c.price === 0 ? requestEnroll(c) : setCheckout(c))}
                                                                onUnsave={() => saved.toggleCourse(c.id)}
                                                            />
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                            {showArticles && (
                                                <section>
                                                    <GroupHeader icon={Newspaper} title="Bài viết" count={savedArticles.length} tone="bg-sky-500" />
                                                    <ul className="rounded-lg border border-line divide-y divide-line-2 overflow-hidden">
                                                        {savedArticles.map((a) => (
                                                            <ArticleRow key={a.id} article={a} onOpen={() => navigate('/articles')} onUnsave={() => saved.toggleArticle(a.id)} />
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </MacWindow>
                </motion.div>
            </div>

            <EnrollConfirmModal course={pendingCourse} loading={enrolling} onCancel={cancelEnroll} onConfirm={confirmEnroll} />
            <CheckoutModal
                isOpen={checkout !== null}
                onClose={() => setCheckout(null)}
                title={checkout?.title ?? ''}
                price={checkout?.price ?? 0}
                onSuccess={async () => {
                    if (!checkout) return;
                    try { await enrollmentService.enroll(checkout.id); }
                    catch (e) { console.error(e); showToast.error('Thanh toán xong nhưng chưa ghi danh được. Vui lòng vào trang chi tiết khóa học để thử lại.'); }
                }}
                onEnterCourse={() => checkout && navigate(`/courses/${checkout.id}/learn`)}
            />
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

const GroupHeader: React.FC<{ icon: LucideIcon; title: string; count: number; tone: string }> = ({ icon: Icon, title, count, tone }) => (
    <header className="flex items-center gap-2 mb-2 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
        <span className={cn('w-1.5 h-1.5 rounded-full', tone)} />
        <Icon className="w-3.5 h-3.5" />
        {title}
        <span className="text-fg-subtle normal-case tracking-normal">— {count} mục</span>
        <span className="flex-1 h-px bg-line" />
    </header>
);

/** Nút bỏ lưu — hiện khi rê chuột vào dòng. */
const UnsaveButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        aria-label="Bỏ lưu"
        title="Bỏ lưu"
        className="flex w-7 h-7 items-center justify-center rounded-md text-fg-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition-all"
    >
        <BookmarkX className="w-3.5 h-3.5" />
    </button>
);

const CourseRow: React.FC<{
    course: Course;
    enrollment?: { progress: number; isCompleted: boolean };
    onOpen: () => void; onLearn: () => void; onEnroll: () => void; onUnsave: () => void;
}> = ({ course, enrollment, onOpen, onLearn, onEnroll, onUnsave }) => {
    const lvl = LEVEL[course.level] ?? LEVEL.Beginner;
    const gradient = THUMBNAIL_GRADIENTS[course.id % THUMBNAIL_GRADIENTS.length];
    const isPro = course.price > 0;

    return (
        <li onClick={onOpen} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 h-16 cursor-pointer transition-colors hover:bg-primary-500/[0.05]">
            <span className={cn('flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br text-white font-mono font-bold', gradient)}>
                {course.title.charAt(0)}
            </span>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{course.title}</p>
                <p className="flex items-center gap-2 font-mono text-[11px] text-fg-muted truncate">
                    <Badge variant={lvl.badge} size="sm" className="normal-case tracking-normal">{lvl.label}</Badge>
                    {course.lessonCount > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} bài</span>}
                    {course.totalDurationSeconds > 0 && <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" />{formatDurationSeconds(course.totalDurationSeconds)}</span>}
                    {course.rating > 0 && <span className="hidden sm:flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{course.rating.toFixed(1)}</span>}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <span className="hidden sm:inline font-mono text-[12px] font-semibold tabular-nums">
                    {isPro ? <span className="text-fg">{course.price.toLocaleString('vi-VN')} ₫</span> : <span className="text-code-600 dark:text-emerald-400">Miễn phí</span>}
                </span>
                {/* Đã ghi danh thì vào học thẳng — không hiện "Đăng ký" cho khóa đã có */}
                {enrollment ? (
                    <Button size="xs" variant="soft" onClick={(e) => { e.stopPropagation(); onLearn(); }}>
                        <Play className="w-3 h-3 fill-current" />
                        {enrollment.isCompleted ? 'Xem lại' : enrollment.progress > 0 ? `Tiếp tục · ${Math.round(enrollment.progress)}%` : 'Vào học'}
                    </Button>
                ) : (
                    <Button size="xs" variant={isPro ? 'primary' : 'soft'} onClick={(e) => { e.stopPropagation(); onEnroll(); }}>
                        {isPro ? 'Mua ngay' : 'Đăng ký'} <ArrowRight className="w-3 h-3" />
                    </Button>
                )}
                <UnsaveButton onClick={onUnsave} />
            </div>
        </li>
    );
};

const ArticleRow: React.FC<{ article: Article; onOpen: () => void; onUnsave: () => void }> = ({ article, onOpen, onUnsave }) => (
    <li onClick={onOpen} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 h-16 cursor-pointer transition-colors hover:bg-sky-500/[0.05]">
        {article.thumbnailUrl
            ? <img src={article.thumbnailUrl} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover bg-surface-2" />
            : <span className="flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-600 text-white"><Newspaper className="w-4 h-4" /></span>}
        <div className="min-w-0">
            <p className="text-[13px] font-semibold text-fg truncate group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">{article.title}</p>
            <p className="flex items-center gap-2 font-mono text-[11px] text-fg-muted truncate">
                {article.category && <span className="px-1 rounded bg-surface-2 text-[10px] text-fg-subtle">{article.category}</span>}
                {article.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTimeMinutes} phút</span>
            </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-fg-muted tabular-nums">
            <span className="hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount.toLocaleString('vi-VN')}</span>
            <span className="hidden sm:flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.likeCount}</span>
            <UnsaveButton onClick={onUnsave} />
        </div>
    </li>
);

const EmptyState: React.FC<{ hasQuery: boolean; hasAny: boolean; onExplore: () => void }> = ({ hasQuery, hasAny, onExplore }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-subtle mb-3">
            {hasAny ? <Inbox className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </div>
        <p className="text-sm font-medium text-fg-2">{hasQuery ? 'Không có mục nào khớp' : 'Chưa lưu gì'}</p>
        <p className="font-mono text-[11px] text-fg-subtle mt-1">
            {hasQuery ? <>{'// '}thử từ khóa khác</> : <>{'// '}bấm ♥ trên khóa học hoặc 🔖 trên bài viết để lưu</>}
        </p>
        {!hasQuery && !hasAny && (
            <Button size="sm" className="mt-4" onClick={onExplore}>Khám phá khóa học <ArrowRight className="w-3.5 h-3.5" /></Button>
        )}
    </div>
);

export default SavedPage;
