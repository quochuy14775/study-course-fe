import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, CheckCircle2, Circle, Clock, PlayCircle,
    BookOpen, ArrowLeft, ArrowRight, Menu, X,
    MessageSquare, HelpCircle, Send, ThumbsUp, ChevronRight,
    Sparkles, BookMarked,
} from 'lucide-react';
import { toast } from 'react-toastify';
import NotePanel from './NotePanel';
import courseService from '../../../services/courseServices';
import lessonService from '../../../services/lessonService';
import chapterService from '../../../services/chapterService';
import lessonInteractionService from '../../../services/lessonInteractionService';
import { useAuthStore } from '../../../stores/authStore';
import { Course, formatDurationSeconds } from '../../../types/course';
import { Lesson } from '../../../types/lesson';
import type { Chapter } from '../../../types/chapter';
import type { Note, Comment, Question } from '../../../types/lessonInteraction';

interface ChapterGroup { chapterId: number | null; title: string; lessons: Lesson[] }

interface YouTubePlayerHandle {
    getCurrentTime: () => number;
    seekTo: (seconds: number) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
interface ChapterGroup { chapterId: number | null; title: string; lessons: Lesson[] }

function groupByChapter(lessons: Lesson[], chapters: Chapter[]): ChapterGroup[] {
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));
    const map: Record<string, Lesson[]> = {};
    for (const l of lessons) {
        const key = String(l.chapterId ?? 'null');
        if (!map[key]) map[key] = [];
        map[key].push(l);
    }
    // Sort by chapter orderIndex, null-chapter last
    const sortedKeys = Object.keys(map).sort((a, b) => {
        if (a === 'null') return 1;
        if (b === 'null') return -1;
        const orderA = chapterMap.get(Number(a))?.orderIndex ?? 0;
        const orderB = chapterMap.get(Number(b))?.orderIndex ?? 0;
        return orderA - orderB;
    });
    return sortedKeys.map((key) => {
        const chapter = key !== 'null' ? chapterMap.get(Number(key)) : undefined;
        return {
            chapterId: key === 'null' ? null : Number(key),
            title: chapter?.title ?? (key === 'null' ? 'Bài học' : `Chương ${key}`),
            lessons: map[key].slice().sort((a: Lesson, b: Lesson) => a.orderIndex - b.orderIndex),
        };
    });
}

const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (d < 60) return `${d}s trước`;
    if (d < 3600) return `${Math.floor(d / 60)}m trước`;
    if (d < 86400) return `${Math.floor(d / 3600)}h trước`;
    return `${Math.floor(d / 86400)}d trước`;
};


// ─────────────────────────────────────────────────────────────
// YouTube (IFrame API – exposes getCurrentTime / seekTo)
// ─────────────────────────────────────────────────────────────
const YouTubePlayer = React.forwardRef<YouTubePlayerHandle, { videoId: string }>(
    ({ videoId }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const playerRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
            seekTo: (seconds: number) => playerRef.current?.seekTo?.(seconds, true),
        }));

        useEffect(() => {
            let destroyed = false;

            const initPlayer = () => {
                if (destroyed || !containerRef.current) return;
                playerRef.current = new (window as any).YT.Player(containerRef.current, {
                    videoId,
                    playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
                });
            };

            if ((window as any).YT?.Player) {
                initPlayer();
            } else {
                if (!document.getElementById('yt-iframe-api')) {
                    const tag = document.createElement('script');
                    tag.id = 'yt-iframe-api';
                    tag.src = 'https://www.youtube.com/iframe_api';
                    document.head.appendChild(tag);
                }
                const prev = (window as any).onYouTubeIframeAPIReady;
                (window as any).onYouTubeIframeAPIReady = () => {
                    prev?.();
                    initPlayer();
                };
            }

            return () => {
                destroyed = true;
                playerRef.current?.destroy?.();
                playerRef.current = null;
            };
        }, [videoId]);

        return (
            <div className="relative w-full rounded-2xl overflow-hidden shadow-soft-lg" style={{ paddingTop: '56.25%' }}>
                <div ref={containerRef} className="absolute inset-0 w-full h-full" />
            </div>
        );
    }
);
YouTubePlayer.displayName = 'YouTubePlayer';

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
const CommentCard = React.memo(function CommentCard({ comment, onLike, onReply, userInitials, isQA }: {
    comment: Comment;
    onLike: (id: number) => void;
    onReply: (parentCommentId: number, text: string) => Promise<void>;
    userInitials: string;
    isQA?: boolean;
}) {
    const initials = (comment.author ?? 'U').slice(0, 2).toUpperCase();
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await onReply(comment.id, replyText.trim());
            setReplyText('');
            setShowReplyInput(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isQA ? 'bg-gradient-to-br from-accent-500 to-primary-600' : 'bg-gradient-to-br from-primary-500 to-accent-500'
            }`}>
                {comment.avatarUrl
                    ? <img src={comment.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                    : initials}
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
                    <p className="text-sm text-ink-700 leading-relaxed">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 px-2">
                    <button
                        onClick={() => onLike(comment.id)}
                        className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                            comment.liked ? 'text-primary-600' : 'text-ink-400 hover:text-primary-500'
                        }`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${comment.liked ? 'fill-primary-500 text-primary-500' : ''}`} />
                        {comment.likeCount > 0 && comment.likeCount}
                    </button>
                    <button
                        onClick={() => setShowReplyInput(!showReplyInput)}
                        className="flex items-center gap-1 text-[11px] font-medium text-ink-400 hover:text-primary-500 transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" />
                        Trả lời
                    </button>
                </div>

                {showReplyInput && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-ink-100"
                    >
                        <p className="text-[10px] text-ink-400 mb-2">Trả lời cho <span className="font-semibold text-ink-600">{comment.author}</span></p>
                        <div className="flex gap-2 items-start">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-primary-500 to-accent-500`}>
                                {userInitials}
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleSubmitReply();
                                        }
                                    }}
                                    placeholder="Viết trả lời..."
                                    rows={2}
                                    className="w-full resize-none bg-white border border-ink-200 rounded-lg px-3 py-2 text-xs text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-300 transition-all"
                                    style={{ minHeight: '32px', maxHeight: '100px' }}
                                />
                                <button
                                    onClick={handleSubmitReply}
                                    disabled={!replyText.trim() || submitting}
                                    className="absolute right-1.5 bottom-1 p-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {comment.replies?.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-ink-100 space-y-3">
                        {comment.replies.map((r) => (
                            <CommentCard key={r.id} comment={r} onLike={onLike} onReply={onReply} userInitials={userInitials} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

// ─────────────────────────────────────────────────────────────
// Question card
// ─────────────────────────────────────────────────────────────
const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    const [open, setOpen] = useState(false);
    const initials = (question.author ?? 'U').slice(0, 2).toUpperCase();
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-ink-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(v => !v)} className="w-full flex gap-3 p-4 text-left hover:bg-ink-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-accent-500 to-primary-600">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-ink-900">{question.author}</span>
                        {question.isResolved && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-code-50 text-code-600 border border-code-200">Đã giải đáp</span>
                        )}
                        <span className="text-[10px] text-ink-400 ml-auto">{timeAgo(question.createdAt)}</span>
                    </div>
                    <p className="text-sm text-ink-700 leading-relaxed">{question.content}</p>
                    {question.answerCount > 0 && (
                        <span className="text-[11px] text-primary-600 font-medium mt-1 block">{question.answerCount} câu trả lời</span>
                    )}
                </div>
                <ChevronRight className={`w-4 h-4 text-ink-400 flex-shrink-0 self-center transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>
            {open && question.answers.length > 0 && (
                <div className="px-4 pb-4 space-y-3 border-t border-ink-100 pt-3">
                    {question.answers.map((a) => (
                        <div key={a.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {(a.author ?? 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-ink-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-ink-900">{a.author}</span>
                                    {a.isAcceptedAnswer && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-code-50 text-code-600 border border-code-200">✓ Tốt nhất</span>
                                    )}
                                    <span className="text-[10px] text-ink-400 ml-auto">{timeAgo(a.createdAt)}</span>
                                </div>
                                <p className="text-sm text-ink-700">{a.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

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
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
    const [doneLessons, setDoneLessons] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'comments' | 'qa'>('comments');
    const [comments, setComments] = useState<Comment[]>([]);
    const [qaList, setQaList] = useState<Question[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteInput, setNoteInput] = useState('');
    const [notesOpen, setNotesOpen] = useState(!isMobile);
    const playerRef = useRef<YouTubePlayerHandle>(null);

    const groups = useMemo(() => groupByChapter(lessons, chapters), [lessons, chapters]);
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
                const [c, l, ch] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessons(courseId, { count: true, orderby: 'OrderIndex asc' }),
                    chapterService.getChapters(courseId),
                ]);
                setCourse(c);
                setLessons(l.value ?? []);
                setChapters(ch ?? []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [courseId]);

    // Load comments, Q&A, notes from API when lesson changes
    useEffect(() => {
        if (!currentLesson) return;
        let cancelled = false;
        setNoteInput('');
        Promise.all([
            lessonInteractionService.getNotes(currentLesson.id),
            lessonInteractionService.getComments(currentLesson.id),
            lessonInteractionService.getQuestions(currentLesson.id),
        ]).then(([n, c, q]) => {
            if (cancelled) return;
            setNotes(n);
            setComments(c);
            setQaList(q);
        }).catch((e) => {
            if (!cancelled) console.error(e);
        });
        return () => { cancelled = true; };
    }, [currentLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

    /** Fallback: nếu backend trả về "Người dùng" / rỗng thì dùng thông tin từ store */
    const resolveAuthor = useCallback((apiAuthor: string): string =>
        apiAuthor && apiAuthor !== 'Người dùng' && apiAuthor !== 'Unknown'
            ? apiAuthor
            : (user?.name || user?.email || 'Bạn'),
    [user]);

    const addComment = async (text: string) => {
        if (!currentLesson) return;
        try {
            const c = await lessonInteractionService.createComment(currentLesson.id, { content: text });
            setComments((prev) => [{ ...c, author: resolveAuthor(c.author) }, ...prev]);
        } catch (e) {
            console.error(e);
            toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
        }
    };

    const addQA = async (text: string) => {
        if (!currentLesson) return;
        try {
            const q = await lessonInteractionService.createQuestion(currentLesson.id, { content: text });
            setQaList((prev) => [{ ...q, author: resolveAuthor(q.author) }, ...prev]);
        } catch (e) {
            console.error(e);
            toast.error('Không thể gửi câu hỏi. Vui lòng thử lại.');
        }
    };

    const toggleLikeComment = useCallback(async (id: number) => {
        if (!currentLesson) return;
        try {
            const res = await lessonInteractionService.toggleCommentLike(currentLesson.id, id);
            setComments((prev) => prev.map((c) =>
                c.id === id ? { ...c, liked: res.liked, likeCount: res.likeCount } : c
            ));
        } catch (e) { console.error(e); }
    }, [currentLesson]);

    const addReply = useCallback(async (parentCommentId: number, text: string) => {
        if (!currentLesson) return;
        try {
            const newReply = await lessonInteractionService.createComment(currentLesson.id, {
                content: text,
                parentCommentId,
            });
            const patchedReply = { ...newReply, author: resolveAuthor(newReply.author) };
            setComments((prev) =>
                prev.map((c) => {
                    if (c.id === parentCommentId) {
                        return { ...c, replies: [...(c.replies ?? []), patchedReply] };
                    }
                    if (c.replies?.length > 0) {
                        return {
                            ...c,
                            replies: c.replies.map((r) =>
                                r.id === parentCommentId
                                    ? { ...r, replies: [...(r.replies ?? []), patchedReply] }
                                    : r
                            ),
                        };
                    }
                    return c;
                })
            );
        } catch (e) {
            console.error(e);
            toast.error('Không thể gửi trả lời. Vui lòng thử lại.');
        }
    }, [currentLesson, resolveAuthor]);

    const addNote = async () => {
        if (!noteInput.trim() || !currentLesson) return;
        const videoTimestamp = Math.floor(playerRef.current?.getCurrentTime() ?? 0);
        try {
            const note = await lessonInteractionService.createNote(currentLesson.id, {
                content: noteInput.trim(),
                videoTimestamp,
            });
            setNotes((prev) => [...prev, note].sort((a, b) => a.videoTimestamp - b.videoTimestamp));
            setNoteInput('');
        } catch (e) { console.error(e); }
    };

    const deleteNote = async (id: number) => {
        if (!currentLesson) return;
        try {
            await lessonInteractionService.deleteNote(currentLesson.id, id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch (e) { console.error(e); }
    };

    const editNote = async (id: number, content: string) => {
        if (!currentLesson) return;
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        try {
            const updated = await lessonInteractionService.updateNote(currentLesson.id, id, {
                content,
                videoTimestamp: note.videoTimestamp,
            });
            setNotes((prev) => prev.map((n) => n.id === id ? updated : n));
        } catch (e) { console.error(e); }
    };

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

            {/* Mobile backdrop for sidebar */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    aria-hidden
                />
            )}

            {/* ── Sidebar ──────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.aside
                        key="sidebar"
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-[85vw] max-w-[296px] md:w-[296px] md:flex-shrink-0 h-full bg-white border-r border-ink-200 flex flex-col overflow-hidden shadow-soft md:shadow-none"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-4 py-4 border-b border-ink-100">
                            <button
                                onClick={() => navigate(`/`)}
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
                <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2.5 bg-white border-b border-ink-200 shadow-soft">
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

                    {/* Notes toggle */}
                    <button
                        onClick={() => setNotesOpen(v => !v)}
                        title="Ghi chú"
                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 flex items-center gap-1.5 text-xs font-medium ${
                            notesOpen
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'text-ink-400 hover:text-ink-700 hover:bg-ink-100'
                        }`}
                    >
                        <BookMarked className="w-4 h-4" />
                        <span className="hidden sm:inline">Ghi chú</span>
                        {notes.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                                {notes.length}
                            </span>
                        )}
                    </button>

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

                {/* ── 2-column area — single outer scroll so scrollbar sits far right ── */}
                <div className="flex-1 overflow-y-auto bg-ink-50">
                <div className="flex min-h-full">

                    {/* Left column: video + lesson info + comments */}
                    <div className="flex-1 min-w-0">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">

                            {/* Video */}
                            <motion.div
                                key={currentLesson?.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                {currentLesson?.videoId ? (
                                    <YouTubePlayer ref={playerRef} videoId={currentLesson.videoId} />
                                ) : (
                                    <div className="aspect-video bg-ink-200 rounded-2xl flex items-center justify-center border border-ink-200">
                                        <p className="text-ink-400 text-sm">Video không khả dụng</p>
                                    </div>
                                )}
                            </motion.div>

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
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => prevLesson && goToLesson(prevLesson.id)}
                                            disabled={!prevLesson}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-100 hover:bg-ink-200 text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Bài trước
                                        </button>
                                        <button
                                            onClick={markDone}
                                            disabled={!nextLesson && (currentLesson ? doneLessons.has(currentLesson.id) : true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:brightness-105 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
                                        >
                                            {nextLesson ? 'Bài tiếp' : 'Hoàn thành'} <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {currentLesson?.description && (
                                    <p className="text-sm text-ink-500 leading-relaxed mt-3 pt-3 border-t border-ink-100">
                                        {currentLesson.description}
                                    </p>
                                )}
                            </motion.div>

                            {/* Comments / QA */}
                            <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
                                <div className="flex border-b border-ink-100">
                                    {([
                                        { key: 'comments', label: 'Bình luận', icon: MessageSquare, count: comments.length },
                                        { key: 'qa', label: 'Hỏi & Đáp', icon: HelpCircle, count: qaList.length },
                                    ] as const).map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all relative ${activeTab === tab.key ? 'text-primary-600' : 'text-ink-500 hover:text-ink-700'}`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-ink-100 text-ink-500'}`}>
                                                {tab.count}
                                            </span>
                                            {activeTab === tab.key && (
                                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-5">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'comments' ? (
                                            <motion.div key="comments" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }} className="space-y-5">
                                                <CommentInput placeholder="Chia sẻ cảm nhận về bài học này..." onSubmit={addComment} userInitials={userInitials} />
                                                <div className="space-y-4">{comments.map((c) => <CommentCard key={c.id} comment={c} onLike={toggleLikeComment} onReply={addReply} userInitials={userInitials} />)}</div>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="qa" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                                                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-accent-50 border border-accent-200">
                                                    <Sparkles className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-accent-700 leading-relaxed">Đặt câu hỏi rõ ràng về nội dung bài học để nhận được hỗ trợ nhanh nhất từ giảng viên và cộng đồng.</p>
                                                </div>
                                                <CommentInput placeholder="Bạn đang thắc mắc điều gì về bài học này?" onSubmit={addQA} userInitials={userInitials} isQA />
                                                <div className="space-y-3">{qaList.map((q) => <QuestionCard key={q.id} question={q} />)}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Mobile backdrop for notes */}
                    {notesOpen && (
                        <div
                            onClick={() => setNotesOpen(false)}
                            className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                            aria-hidden
                        />
                    )}

                    {/* Right column: Notes panel — drawer on mobile, sticky side on desktop */}
                    <AnimatePresence initial={false}>
                        {notesOpen && (
                            <motion.aside
                                key="notes-panel"
                                initial={{ x: 320, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 320, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="fixed md:sticky md:self-start inset-y-0 right-0 top-0 z-40 md:z-auto w-[88vw] max-w-[320px] md:w-[300px] md:flex-shrink-0 h-full md:h-[600px] overflow-hidden border-l border-ink-200 bg-ink-50 shadow-2xl md:shadow-none"
                            >
                                <div className="w-full md:w-[300px] h-full flex flex-col px-3 py-4">
                                    <NotePanel
                                        notes={notes}
                                        noteInput={noteInput}
                                        currentTimestamp={playerRef.current?.getCurrentTime() ?? 0}
                                        onNoteInputChange={setNoteInput}
                                        onAddNote={addNote}
                                        onDeleteNote={deleteNote}
                                        onSeekTo={(ts) => playerRef.current?.seekTo(ts)}
                                        onEditNote={editNote}
                                    />
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                </div>{/* end flex min-h-full */}
                </div>{/* end outer scroll */}
            </div>
        </div>
    );
};

export default LearnPage;
