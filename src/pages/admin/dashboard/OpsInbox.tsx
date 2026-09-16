import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    AlertCircle, AlertTriangle, Info, ArrowRight, X, Star, MessageSquareReply, ExternalLink,
    ThumbsUp, Undo2, Send, CheckCircle2, Inbox, type LucideIcon,
} from 'lucide-react';
import { showToast } from '../../../components/CustomToast';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import courseService from '../../../services/courseServices';
import lessonInteractionService from '../../../services/lessonInteractionService';
import reviewService from '../../../services/reviewService';
import { cn } from '../../../lib/cn';
import { DashCard, CardTitle, timeAgo } from './shared';
import { useDashboard } from './data';
import type { ActionItem, ActionTone, OpenQuestion, LowReview } from '../../../mockDatas/mockAdminDashboard';

type Tab = 'actions' | 'questions' | 'reviews';

const TONE: Record<ActionTone, { icon: LucideIcon; cls: string; label: string }> = {
    critical: { icon: AlertCircle,   cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',   label: 'Khẩn' },
    warning:  { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', label: 'Cần làm' },
    info:     { icon: Info,          cls: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',       label: 'Gợi ý' },
};

interface ReplyTarget {
    title: string;
    context: string;
    /** Gửi thật (API) hoặc giả lập (mock). Ném lỗi nếu thất bại. */
    send: (text: string) => Promise<void>;
    onDone: () => void;
}

/** Mock: chờ một nhịp cho giống mạng thật. */
const fakeSend = () => new Promise<void>((r) => setTimeout(r, 650));

const rowMotion = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: 32, height: 0, marginBottom: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const } },
};

/**
 * Hộp thư vận hành: mọi thứ admin phải phản hồi, gom một chỗ, xử lý tại chỗ.
 * Có API: trả lời câu hỏi / phản hồi review / bật lại khóa gọi endpoint thật.
 * Mock: chỉ hiện toast và gỡ item khỏi danh sách. "Bỏ qua" luôn là local (có hoàn tác).
 */
const OpsInbox: React.FC = () => {
    const navigate = useNavigate();
    const data = useDashboard();
    const isApi = data.source === 'api';
    const [tab, setTab] = useState<Tab>('actions');
    const [actions, setActions] = useState<ActionItem[]>(data.actionItems);
    const [questions, setQuestions] = useState<OpenQuestion[]>(data.openQuestions);
    const [reviews, setReviews] = useState<LowReview[]>(data.lowReviews);
    const [undo, setUndo] = useState<{ label: string; restore: () => void } | null>(null);
    const [reply, setReply] = useState<ReplyTarget | null>(null);
    const undoTimer = useRef<number | undefined>(undefined);

    // Dữ liệu tải lại (đổi range / refresh) → đồng bộ lại danh sách
    useEffect(() => { setActions(data.actionItems); }, [data.actionItems]);
    useEffect(() => { setQuestions(data.openQuestions); }, [data.openQuestions]);
    useEffect(() => { setReviews(data.lowReviews); }, [data.lowReviews]);

    const counts: Record<Tab, number> = { actions: actions.length, questions: questions.length, reviews: reviews.length };
    const total = counts.actions + counts.questions + counts.reviews;

    const withUndo = (label: string, restore: () => void) => {
        window.clearTimeout(undoTimer.current);
        setUndo({ label, restore });
        undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
    };
    useEffect(() => () => window.clearTimeout(undoTimer.current), []);

    /* ── Hành động ── */
    const dismissAction = (a: ActionItem) => {
        setActions((l) => l.filter((x) => x.id !== a.id));
        withUndo(`Đã bỏ qua "${a.title}"`, () => setActions((l) => [a, ...l]));
    };
    const runAction = async (a: ActionItem) => {
        if (a.to) return navigate(a.to);
        if (a.inline === 'reply-questions') return setTab('questions');
        if (a.inline === 'reply-reviews') return setTab('reviews');
        if (a.inline === 'enable') {
            try {
                if (isApi) await courseService.enableCourses([a.courseId]);
                setActions((l) => l.filter((x) => x.id !== a.id));
                showToast.success('Đã bật lại khóa học. Học viên có thể tiếp tục học.');
            } catch (e) {
                console.error(e);
                showToast.error('Không bật lại được khóa học. Thử lại sau.');
            }
        }
    };
    const resolveQuestion = (q: OpenQuestion) =>
        setReply({
            title: `Trả lời ${q.user}`,
            context: q.text,
            send: isApi
                ? async (text) => { await lessonInteractionService.createAnswer(q.lessonId, q.id, { content: text }); }
                : fakeSend,
            onDone: () => setQuestions((l) => l.filter((x) => x.id !== q.id)),
        });
    const replyReview = (r: LowReview) =>
        setReply({
            title: `Phản hồi ${r.user} · ${r.rating}★`,
            context: r.text,
            send: isApi
                ? async (text) => { await reviewService.addReply(r.courseId, r.id, text); }
                : fakeSend,
            onDone: () => setReviews((l) => l.filter((x) => x.id !== r.id)),
        });
    const dismissQuestion = (q: OpenQuestion) => {
        setQuestions((l) => l.filter((x) => x.id !== q.id));
        withUndo('Đã ẩn câu hỏi', () => setQuestions((l) => [q, ...l]));
    };
    const dismissReview = (r: LowReview) => {
        setReviews((l) => l.filter((x) => x.id !== r.id));
        withUndo('Đã ẩn review', () => setReviews((l) => [r, ...l]));
    };

    const TABS: Array<{ id: Tab; label: string }> = [
        { id: 'actions',   label: 'Cần xử lý' },
        { id: 'questions', label: 'Hỏi đáp' },
        { id: 'reviews',   label: 'Review thấp' },
    ];

    return (
        <DashCard className="h-full">
            <CardTitle
                title={
                    <span className="inline-flex items-center gap-2">
                        Hộp thư vận hành
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 text-[11px] font-bold">
                            <NumberFlow value={total} />
                        </span>
                    </span>
                }
                description="Mọi thứ cần bạn phản hồi, xử lý ngay tại đây"
            />

            {/* Tabs */}
            <div className="px-5 mt-3 border-b border-line">
                <div className="flex gap-1 -mb-px" role="tablist">
                    {TABS.map((t) => {
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors',
                                    active ? 'text-primary-700 dark:text-primary-300' : 'text-fg-muted hover:text-fg',
                                )}
                            >
                                {t.label}
                                <span className={cn('inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums', active ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200' : 'bg-surface-2 text-fg-muted')}>
                                    <NumberFlow value={counts[t.id]} />
                                </span>
                                {active && (
                                    <motion.span
                                        layoutId="ops-tab-underline"
                                        className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                                        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            <div className="relative flex-1 min-h-[300px] px-3 py-3">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {tab === 'actions' && (
                            <List empty="Không còn việc tồn đọng. Tuyệt!">
                                {actions.map((a) => {
                                    const t = TONE[a.tone];
                                    return (
                                        <motion.li key={a.id} layout {...rowMotion} className="mb-1 overflow-hidden">
                                            <div className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2">
                                                <Tooltip content={t.label} side="left">
                                                    <span className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', t.cls)}>
                                                        <t.icon className="w-4 h-4" />
                                                    </span>
                                                </Tooltip>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-fg truncate">{a.title}</p>
                                                    <p className="text-[11px] text-fg-muted truncate">{a.meta}</p>
                                                </div>
                                                <Button size="xs" variant="soft" onClick={() => runAction(a)} className="flex-shrink-0">
                                                    {a.cta} <ArrowRight className="w-3 h-3" />
                                                </Button>
                                                <DismissButton onClick={() => dismissAction(a)} />
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </List>
                        )}

                        {tab === 'questions' && (
                            <List empty="Mọi câu hỏi đã được trả lời.">
                                {questions.map((q) => (
                                    <motion.li key={q.id} layout {...rowMotion} className="mb-1 overflow-hidden">
                                        <div className="group flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2">
                                            <Avatar name={q.user} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-fg">{q.user}</p>
                                                    <span className="text-[11px] text-fg-subtle">{q.course} · {q.lesson}</span>
                                                </div>
                                                <p className="text-xs text-fg-2 mt-0.5 line-clamp-2 leading-relaxed">{q.text}</p>
                                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-fg-subtle">
                                                    <span>{timeAgo(q.askedAt)}</span>
                                                    {q.votes != null && <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {q.votes}</span>}
                                                    <button onClick={() => navigate(`/courses/${q.courseId}/learn/${q.lessonId}`)} className="inline-flex items-center gap-1 hover:text-primary-600">
                                                        Xem bài <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <Button size="xs" variant="soft" onClick={() => resolveQuestion(q)}>
                                                    <MessageSquareReply className="w-3 h-3" /> Trả lời
                                                </Button>
                                                <DismissButton onClick={() => dismissQuestion(q)} always />
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </List>
                        )}

                        {tab === 'reviews' && (
                            <List empty="Không có review thấp nào chưa phản hồi.">
                                {reviews.map((r) => (
                                    <motion.li key={r.id} layout {...rowMotion} className="mb-1 overflow-hidden">
                                        <div className="group flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2">
                                            <Avatar name={r.user} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-fg">{r.user}</p>
                                                    <Stars value={r.rating} />
                                                    <span className="text-[11px] text-fg-subtle">{r.course}</span>
                                                </div>
                                                <p className="text-xs text-fg-2 mt-0.5 line-clamp-2 leading-relaxed">"{r.text}"</p>
                                                <p className="text-[11px] text-fg-subtle mt-1.5">{timeAgo(r.at)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <Button size="xs" variant="soft" onClick={() => replyReview(r)}>
                                                    <MessageSquareReply className="w-3 h-3" /> Phản hồi
                                                </Button>
                                                <DismissButton onClick={() => dismissReview(r)} always />
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </List>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Undo bar */}
            <AnimatePresence>
                {undo && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="mx-3 mb-3 flex items-center gap-3 rounded-xl bg-ink-900 text-white px-3.5 py-2.5 text-xs shadow-soft-lg dark:bg-ink-100 dark:text-ink-900"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
                        <span className="flex-1 truncate">{undo.label}</span>
                        <button
                            onClick={() => { undo.restore(); setUndo(null); }}
                            className="inline-flex items-center gap-1 font-semibold text-primary-200 hover:text-white dark:text-primary-700 dark:hover:text-primary-900"
                        >
                            <Undo2 className="w-3.5 h-3.5" /> Hoàn tác
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <ReplyDialog target={reply} onClose={() => setReply(null)} />
        </DashCard>
    );
};

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

const List: React.FC<{ empty: string; children: React.ReactNode[] }> = ({ empty, children }) => (
    <ul className="relative">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
        {children.length === 0 && (
            <motion.li initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-14 text-center">
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-3">
                    <Inbox className="w-5 h-5" />
                </span>
                <p className="text-sm font-medium text-fg-2">{empty}</p>
            </motion.li>
        )}
    </ul>
);

const DismissButton: React.FC<{ onClick: () => void; always?: boolean }> = ({ onClick, always }) => (
    <Tooltip content="Bỏ qua" side="top">
        <button
            onClick={onClick}
            aria-label="Bỏ qua"
            className={cn(
                'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-3 transition-all',
                !always && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            )}
        >
            <X className="w-3.5 h-3.5" />
        </button>
    </Tooltip>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => (
    <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`}
        alt=""
        loading="lazy"
        className="w-9 h-9 rounded-full bg-surface-2 ring-1 ring-line flex-shrink-0"
    />
);

const Stars: React.FC<{ value: number }> = ({ value }) => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sao`}>
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('w-3 h-3', i < value ? 'text-amber-400 fill-amber-400' : 'text-line')} />
        ))}
    </span>
);

/** Dialog trả lời — Radix lo focus/ESC/scroll-lock; gửi là mock. */
const ReplyDialog: React.FC<{ target: ReplyTarget | null; onClose: () => void }> = ({ target, onClose }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const last = useRef<ReplyTarget | null>(null);
    if (target) last.current = target;
    const shown = target ?? last.current;

    useEffect(() => { if (target) setText(''); }, [target]);

    const send = async () => {
        if (!text.trim() || !shown) return;
        setSending(true);
        try {
            await shown.send(text.trim());
            showToast.success('Đã gửi phản hồi. Học viên sẽ nhận được thông báo.');
            shown.onDone();
            onClose();
        } catch (e) {
            console.error(e);
            showToast.error('Gửi phản hồi thất bại. Thử lại sau.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog.Root open={!!target} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink-950/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className={cn(
                        'fixed inset-x-4 top-[14vh] z-[70] mx-auto w-auto max-w-lg outline-none',
                        'rounded-2xl border border-line bg-surface shadow-[0_24px_80px_-12px_rgb(15_23_42/0.35)] overflow-hidden',
                        'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
                    )}
                >
                    <div className="relative px-5 pt-5 pb-4 border-b border-line">
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
                        <Dialog.Title className="text-base font-bold text-fg pr-8">{shown?.title}</Dialog.Title>
                        {shown?.context && (
                            <blockquote className="mt-2 pl-3 border-l-2 border-primary-300 dark:border-primary-500/50 text-xs text-fg-muted leading-relaxed line-clamp-3">
                                {shown.context}
                            </blockquote>
                        )}
                        <Dialog.Close className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-fg-muted transition-colors" aria-label="Đóng">
                            <X className="w-4 h-4" />
                        </Dialog.Close>
                    </div>
                    <div className="p-5">
                        <textarea
                            autoFocus
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }}
                            rows={4}
                            placeholder="Viết phản hồi... (⌘/Ctrl + Enter để gửi)"
                            className="w-full resize-none rounded-xl border border-line bg-surface-2/50 px-3.5 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary-500 focus:bg-surface focus:ring-4 focus:ring-primary-500/10 transition-all"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-[11px] text-fg-subtle">Học viên sẽ nhận thông báo và email.</p>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={onClose}>Để sau</Button>
                                <Button size="sm" onClick={send} loading={sending} disabled={!text.trim()}>
                                    <Send className="w-3.5 h-3.5" /> Gửi
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default OpsInbox;
