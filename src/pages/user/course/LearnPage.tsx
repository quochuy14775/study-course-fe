import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, CheckCircle2, Circle, Clock, PlayCircle,
    BookOpen, ArrowLeft, ArrowRight, Menu, X,
    MessageSquare, HelpCircle, Send, ThumbsUp, ChevronRight,
    Sparkles,
} from 'lucide-react';
import courseService from '../../../services/courseServices';
import lessonService from '../../../services/lessonService';
import { useAuthStore } from '../../../stores/authStore';
import { Course, formatDurationSeconds } from '../../../types/course';
import { Lesson } from '../../../types/lesson';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Comment {
    id: number;
    author: string;
    avatar: string;
    text: string;
    likes: number;
    liked: boolean;
    createdAt: string;
    replies?: Comment[];
}

interface ChapterGroup { chapterId: number | null; title: string; lessons: Lesson[] }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function groupByChapter(lessons: Lesson[]): ChapterGroup[] {
    const map: Record<string, Lesson[]> = {};
    for (const l of lessons) {
        const key = String(l.chapterId ?? 'null');
        if (!map[key]) map[key] = [];
        map[key].push(l);
    }
    let idx = 1;
    return Object.keys(map).map((key) => ({
        chapterId: key === 'null' ? null : Number(key),
        title: key === 'null' ? 'Bài học' : `Chương ${idx++}`,
        lessons: map[key].slice().sort((a: Lesson, b: Lesson) => a.orderIndex - b.orderIndex),
    }));
}

const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (d < 60) return `${d}s trước`;
    if (d < 3600) return `${Math.floor(d / 60)}m trước`;
    if (d < 86400) return `${Math.floor(d / 3600)}h trước`;
    return `${Math.floor(d / 86400)}d trước`;
};

const seedComments = (lessonId: number): Comment[] => [
    { id: 1, author: 'Minh Tuấn', avatar: 'MT', text: 'Bài này rất dễ hiểu, cảm ơn thầy!', likes: 12, liked: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, author: 'Lan Anh', avatar: 'LA', text: 'Phần giải thích về hooks cực kỳ chi tiết, mình đã hiểu hơn nhiều so với tài liệu gốc.', likes: 7, liked: false, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 3, author: 'Đức Huy', avatar: 'ĐH', text: 'Có thể cho mình hỏi thêm về phần useEffect không ạ?', likes: 3, liked: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const seedQA = (lessonId: number): Comment[] => [
    { id: 101, author: 'Thành Đạt', avatar: 'TĐ', text: 'Sự khác biệt giữa useMemo và useCallback là gì? Khi nào nên dùng cái nào?', likes: 5, liked: false, createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 102, author: 'Hương Giang', avatar: 'HG', text: 'Tại sao dependency array của useEffect cần phải đầy đủ? Có thể bỏ qua không?', likes: 8, liked: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// ─────────────────────────────────────────────────────────────
// YouTube
// ─────────────────────────────────────────────────────────────
const YouTubePlayer: React.FC<{ videoId: string }> = ({ videoId }) => (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-soft-lg" style={{ paddingTop: '56.25%' }}>
        <iframe
            key={videoId}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Lesson video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        />
    </div>
);

// ─────────────────────────────────────────────────────────────
// Lesson row
// ─────────────────────────────────────────────────────────────
const LessonRow: React.FC<{
    lesson: Lesson; index: number; isActive: boolean; isDone: boolean; onClick: () => void;
}> = ({ lesson, index, isActive, isDone, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
            isActive
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-ink-50 border border-transparent'
        }`}
    >
        <div className="flex-shrink-0 mt-0.5">
            {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-code-500" />
            ) : isActive ? (
                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <PlayCircle className="w-4 h-4 text-primary-500" />
                </motion.div>
            ) : (
                <Circle className="w-4 h-4 text-ink-300 group-hover:text-ink-400 transition-colors" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium leading-snug line-clamp-2 ${
                isActive ? 'text-primary-700' : isDone ? 'text-ink-400' : 'text-ink-700 group-hover:text-ink-900'
            }`}>
                <span className="text-ink-400 mr-1 font-mono">{index}.</span>
                {lesson.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
                {lesson.duration && (
                    <span className="flex items-center gap-0.5 text-[10px] text-ink-400">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDurationSeconds(lesson.duration)}
                    </span>
                )}
                {lesson.isPreview && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-code-50 text-code-600 border border-code-200">
                        Preview
                    </span>
                )}
            </div>
        </div>
    </button>
);

// ─────────────────────────────────────────────────────────────
// Comment card
// ─────────────────────────────────────────────────────────────
const CommentCard: React.FC<{
    comment: Comment;
    onLike: (id: number) => void;
    isQA?: boolean;
}> = ({ comment, onLike, isQA }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
    >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            isQA ? 'bg-gradient-to-br from-accent-500 to-primary-600' : 'bg-gradient-to-br from-primary-500 to-accent-500'
        }`}>
            {comment.avatar}
        </div>
        <div className="flex-1 min-w-0">
            <div className="bg-ink-50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-ink-900">{comment.author}</span>
                    {isQA && (
                        <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-50 text-accent-600 border border-accent-200">
                            <HelpCircle className="w-2.5 h-2.5" /> Hỏi bài
                        </span>
                    )}
                    <span className="text-[10px] text-ink-400 ml-auto">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{comment.text}</p>
            </div>
            <div className="flex items-center gap-3 mt-1.5 px-2">
                <button
                    onClick={() => onLike(comment.id)}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                        comment.liked ? 'text-primary-600' : 'text-ink-400 hover:text-primary-500'
                    }`}
                >
                    <ThumbsUp className={`w-3 h-3 ${comment.liked ? 'fill-primary-500 text-primary-500' : ''}`} />
                    {comment.likes > 0 && comment.likes}
                </button>
                <button className="text-[11px] font-medium text-ink-400 hover:text-ink-700 transition-colors">
                    Trả lời
                </button>
            </div>
        </div>
    </motion.div>
);

// ─────────────────────────────────────────────────────────────
// Comment input
// ─────────────────────────────────────────────────────────────
const CommentInput: React.FC<{
    placeholder: string;
    onSubmit: (text: string) => void;
    userInitials: string;
    isQA?: boolean;
}> = ({ placeholder, onSubmit, userInitials, isQA }) => {
    const [text, setText] = useState('');
    const ref = useRef<HTMLTextAreaElement>(null);

    const submit = () => {
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText('');
        if (ref.current) ref.current.style.height = 'auto';
    };

    return (
        <div className="flex gap-3 items-start">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isQA ? 'bg-gradient-to-br from-accent-500 to-primary-600' : 'bg-gradient-to-br from-primary-500 to-accent-500'
            }`}>
                {userInitials}
            </div>
            <div className="flex-1 relative">
                <textarea
                    ref={ref}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full resize-none bg-ink-50 border border-ink-200 rounded-2xl px-4 py-2.5 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all leading-relaxed pr-10"
                    style={{ minHeight: '42px', maxHeight: '160px' }}
                />
                <motion.button
                    onClick={submit}
                    whileTap={{ scale: 0.9 }}
                    disabled={!text.trim()}
                    className="absolute right-2.5 bottom-2 p-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-3.5 h-3.5" />
                </motion.button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
const LearnPage: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const userInitials = (user?.name ?? user?.email ?? 'U').slice(0, 2).toUpperCase();

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
    const [doneLessons, setDoneLessons] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'comments' | 'qa'>('comments');
    const [comments, setComments] = useState<Comment[]>([]);
    const [qaList, setQaList] = useState<Comment[]>([]);

    const groups = useMemo(() => groupByChapter(lessons), [lessons]);
    const allLessons = useMemo(() => groups.flatMap((g) => g.lessons), [groups]);
    const currentLesson = useMemo(
        () => (lessonId ? allLessons.find((l) => l.id === Number(lessonId)) : allLessons[0]) ?? null,
        [lessonId, allLessons],
    );
    const currentIdx = useMemo(
        () => currentLesson ? allLessons.findIndex((l) => l.id === currentLesson.id) : -1,
        [currentLesson, allLessons],
    );
    const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
    const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
    const progress = allLessons.length > 0 ? Math.round((doneLessons.size / allLessons.length) * 100) : 0;

    useEffect(() => {
        if (!courseId) return;
        (async () => {
            setLoading(true);
            try {
                const [c, l] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessons(courseId, { count: true, orderby: 'OrderIndex asc' }),
                ]);
                setCourse(c);
                setLessons(l.value ?? []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [courseId]);

    // Load mock comments when lesson changes
    useEffect(() => {
        if (!currentLesson) return;
        setComments(seedComments(currentLesson.id));
        setQaList(seedQA(currentLesson.id));
    }, [currentLesson, currentLesson?.id]);

    useEffect(() => {
        if (!loading && allLessons.length > 0 && !lessonId)
            navigate(`/courses/${courseId}/learn/${allLessons[0].id}`, { replace: true });
    }, [loading, allLessons, lessonId, courseId, navigate]);

    const goToLesson = (id: number) => navigate(`/courses/${courseId}/learn/${id}`);

    const markDone = () => {
        if (!currentLesson) return;
        setDoneLessons((prev) => new Set(prev).add(currentLesson.id));
        if (nextLesson) goToLesson(nextLesson.id);
    };

    const toggleChapter = (key: string) =>
        setCollapsedChapters((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

    const addComment = (text: string) => {
        const c: Comment = {
            id: Date.now(), author: user?.name ?? 'Bạn', avatar: userInitials,
            text, likes: 0, liked: false, createdAt: new Date().toISOString(),
        };
        setComments((prev) => [c, ...prev]);
    };

    const addQA = (text: string) => {
        const c: Comment = {
            id: Date.now(), author: user?.name ?? 'Bạn', avatar: userInitials,
            text, likes: 0, liked: false, createdAt: new Date().toISOString(),
        };
        setQaList((prev) => [c, ...prev]);
    };

    const toggleLikeComment = (id: number) =>
        setComments((prev) => prev.map((c) =>
            c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
        ));

    const toggleLikeQA = (id: number) =>
        setQaList((prev) => prev.map((c) =>
            c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
        ));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-ink-50">
            <motion.div
                className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-ink-50">

            {/* ── Sidebar ──────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.aside
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 296, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="flex-shrink-0 h-full bg-white border-r border-ink-200 flex flex-col overflow-hidden shadow-soft"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-4 py-4 border-b border-ink-100">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-primary-600 transition-colors mb-4 group font-medium"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                                Quay lại
                            </button>
                            <h2 className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug mb-4">
                                {course?.title ?? 'Khóa học'}
                            </h2>
                            {/* Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] text-ink-500">{doneLessons.size}/{allLessons.length} bài đã học</span>
                                    <span className="text-[11px] font-bold text-primary-600">{progress}%</span>
                                </div>
                                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chapters */}
                        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                            {groups.map((group, gi) => {
                                const key = String(group.chapterId ?? 'null');
                                const collapsed = collapsedChapters.has(key);
                                const before = groups.slice(0, gi).reduce((s, g) => s + g.lessons.length, 0);
                                const doneInGroup = group.lessons.filter((l) => doneLessons.has(l.id)).length;

                                return (
                                    <div key={key}>
                                        <button
                                            onClick={() => toggleChapter(key)}
                                            className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-ink-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <BookOpen className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                                                <span className="text-xs font-semibold text-ink-700 truncate">{group.title}</span>
                                                <span className="text-[10px] text-ink-400 flex-shrink-0">{doneInGroup}/{group.lessons.length}</span>
                                            </div>
                                            <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {!collapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                                                    className="overflow-hidden space-y-0.5 ml-1 mt-0.5"
                                                >
                                                    {group.lessons.map((lesson, li) => (
                                                        <LessonRow
                                                            key={lesson.id}
                                                            lesson={lesson}
                                                            index={before + li + 1}
                                                            isActive={currentLesson?.id === lesson.id}
                                                            isDone={doneLessons.has(lesson.id)}
                                                            onClick={() => goToLesson(lesson.id)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── Main ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top bar */}
                <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white border-b border-ink-200 shadow-soft">
                    <button
                        onClick={() => setSidebarOpen((v) => !v)}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-all flex-shrink-0"
                    >
                        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs">
                        <span className="text-ink-400 truncate max-w-[120px] hidden sm:block">{course?.title}</span>
                        <ChevronRight className="w-3 h-3 text-ink-300 flex-shrink-0 hidden sm:block" />
                        <span className="text-ink-700 font-medium truncate">{currentLesson?.title}</span>
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => prevLesson && goToLesson(prevLesson.id)}
                            disabled={!prevLesson}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Trước</span>
                        </button>
                        <button
                            onClick={() => nextLesson && goToLesson(nextLesson.id)}
                            disabled={!nextLesson}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="hidden sm:inline">Tiếp</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <motion.button
                            onClick={markDone}
                            whileTap={{ scale: 0.95 }}
                            disabled={currentLesson ? doneLessons.has(currentLesson.id) : true}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ml-1 ${
                                currentLesson && doneLessons.has(currentLesson.id)
                                    ? 'bg-code-50 text-code-600 border border-code-200 cursor-default'
                                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                                {currentLesson && doneLessons.has(currentLesson.id) ? 'Hoàn thành' : 'Đánh dấu xong'}
                            </span>
                        </motion.button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto bg-ink-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">

                        {/* Video */}
                        {currentLesson?.videoId ? (
                            <motion.div
                                key={currentLesson.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <YouTubePlayer videoId={currentLesson.videoId} />
                            </motion.div>
                        ) : (
                            <div className="aspect-video bg-ink-200 rounded-2xl flex items-center justify-center border border-ink-200">
                                <p className="text-ink-400 text-sm">Video không khả dụng</p>
                            </div>
                        )}

                        {/* Lesson info */}
                        <motion.div
                            key={`info-${currentLesson?.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="bg-white rounded-2xl border border-ink-200 shadow-soft px-5 py-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-base font-bold text-ink-900 leading-snug mb-1.5">
                                        {currentLesson?.title}
                                    </h1>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {currentLesson?.duration && (
                                            <span className="flex items-center gap-1 text-xs text-ink-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDurationSeconds(currentLesson.duration)}
                                            </span>
                                        )}
                                        {currentLesson?.isPreview && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-code-50 text-code-600 border border-code-200">
                                                Preview
                                            </span>
                                        )}
                                        {currentLesson && doneLessons.has(currentLesson.id) && (
                                            <span className="flex items-center gap-1 text-xs text-code-600 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Prev / next nav */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => prevLesson && goToLesson(prevLesson.id)}
                                        disabled={!prevLesson}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-100 hover:bg-ink-200 text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Bài trước
                                    </button>
                                    <button
                                        onClick={markDone}
                                        disabled={!nextLesson && (currentLesson ? doneLessons.has(currentLesson.id) : true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:brightness-105 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
                                    >
                                        {nextLesson ? 'Bài tiếp' : 'Hoàn thành'}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {currentLesson?.description && (
                                <p className="text-sm text-ink-500 leading-relaxed mt-3 pt-3 border-t border-ink-100">
                                    {currentLesson.description}
                                </p>
                            )}
                        </motion.div>

                        {/* ── Comment / QA tabs ───────────────────── */}
                        <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
                            {/* Tab bar */}
                            <div className="flex border-b border-ink-100">
                                {([
                                    { key: 'comments', label: 'Bình luận', icon: MessageSquare, count: comments.length },
                                    { key: 'qa', label: 'Hỏi & Đáp', icon: HelpCircle, count: qaList.length },
                                ] as const).map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all relative ${
                                            activeTab === tab.key
                                                ? 'text-primary-600'
                                                : 'text-ink-500 hover:text-ink-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                            activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-ink-100 text-ink-500'
                                        }`}>
                                            {tab.count}
                                        </span>
                                        {activeTab === tab.key && (
                                            <motion.div
                                                layoutId="tab-indicator"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-5">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'comments' ? (
                                        <motion.div
                                            key="comments"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 8 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-5"
                                        >
                                            <CommentInput
                                                placeholder="Chia sẻ cảm nhận về bài học này..."
                                                onSubmit={addComment}
                                                userInitials={userInitials}
                                            />
                                            <div className="space-y-4">
                                                {comments.map((c) => (
                                                    <CommentCard key={c.id} comment={c} onLike={toggleLikeComment} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="qa"
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-5"
                                        >
                                            {/* QA hint */}
                                            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-accent-50 border border-accent-200">
                                                <Sparkles className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-accent-700 leading-relaxed">
                                                    Đặt câu hỏi rõ ràng về nội dung bài học để nhận được hỗ trợ nhanh nhất từ giảng viên và cộng đồng.
                                                </p>
                                            </div>
                                            <CommentInput
                                                placeholder="Bạn đang thắc mắc điều gì về bài học này?"
                                                onSubmit={addQA}
                                                userInitials={userInitials}
                                                isQA
                                            />
                                            <div className="space-y-4">
                                                {qaList.map((c) => (
                                                    <CommentCard key={c.id} comment={c} onLike={toggleLikeQA} isQA />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
