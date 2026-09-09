import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Star, Clock, BookOpen, ArrowRight, ArrowLeft, ThumbsUp, ShieldCheck, MessageSquare, Send,
} from 'lucide-react';
import { toast } from 'react-toastify';
import courseService from '../../../services/courseServices';
import reviewService from '../../../services/reviewService';
import enrollmentService from '../../../services/enrollmentService';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { useEnrollFlow } from '../../../hooks/useEnrollFlow';
import { useAuthStore } from '../../../stores/authStore';
import AuthGuardModal from '../../../components/AuthGuardModal';
import CheckoutModal from '../../../components/CheckoutModal';
import EnrollConfirmModal from '../../../components/EnrollConfirmModal';
import { Course, formatDurationSeconds } from '../../../types/course';
import type { CourseReview, RatingBreakdown } from '../../../types/review';
import type { Enrollment } from '../../../types/enrollment';

const emptyBreakdown: RatingBreakdown = {
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const StarRow: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                style={{ width: size, height: size }}
                className={i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}
            />
        ))}
    </div>
);

const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d < 1) return 'Hôm nay';
    if (d < 30) return `${d} ngày trước`;
    return `${Math.floor(d / 30)} tháng trước`;
};

const RatingBar: React.FC<{ star: number; count: number; total: number }> = ({ star, count, total }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2 text-xs text-ink-500">
            <span className="w-8 flex-shrink-0">{star} sao</span>
            <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 flex-shrink-0 text-right text-ink-400">{count}</span>
        </div>
    );
};

const ReviewCard: React.FC<{
    review: CourseReview;
    onToggleHelpful: (id: number) => void;
    onReply: (reviewId: number, content: string) => void;
}> = ({ review, onToggleHelpful, onReply }) => {
    const initials = review.author.slice(0, 2).toUpperCase();
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');

    const submitReply = () => {
        if (!replyText.trim()) return;
        onReply(review.id, replyText.trim());
        setReplyText('');
        setShowReplyInput(false);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 py-4 border-b border-ink-100 last:border-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-primary-500 to-accent-500">
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-ink-900">{review.author}</span>
                    <StarRow value={review.rating} size={12} />
                    <span className="text-[11px] text-ink-400">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{review.content}</p>
                <div className="flex items-center gap-3 mt-2">
                    <button
                        onClick={() => onToggleHelpful(review.id)}
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                            review.markedHelpful ? 'text-primary-600' : 'text-ink-400 hover:text-primary-500'
                        }`}
                    >
                        <ThumbsUp className={`w-3 h-3 ${review.markedHelpful ? 'fill-primary-500 text-primary-500' : ''}`} />
                        Hữu ích {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                    </button>
                    <button
                        onClick={() => setShowReplyInput((v) => !v)}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400 hover:text-primary-500 transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" /> Trả lời
                    </button>
                </div>

                {showReplyInput && (
                    <div className="flex gap-2 items-start mt-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply(); }}
                                placeholder={`Trả lời ${review.author}...`}
                                rows={2}
                                autoFocus
                                className="w-full resize-none bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-xs text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all pr-9"
                            />
                            <button
                                onClick={submitReply}
                                disabled={!replyText.trim()}
                                className="absolute right-2 bottom-1.5 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {review.replies.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-ink-100 space-y-3">
                        {review.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2.5">
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                    reply.isInstructor ? 'bg-gradient-to-br from-amber-500 to-accent-500' : 'bg-gradient-to-br from-primary-500 to-accent-500'
                                }`}>
                                    {reply.author.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 bg-ink-50 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs font-bold text-ink-900">{reply.author}</span>
                                        {reply.isInstructor && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Giảng viên</span>
                                        )}
                                        <span className="text-[10px] text-ink-400 ml-auto">{timeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-ink-700 leading-relaxed">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ReviewForm: React.FC<{ onSubmit: (rating: number, content: string) => void }> = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');

    const submit = () => {
        if (!rating || !content.trim()) return;
        onSubmit(rating, content.trim());
        setRating(0);
        setContent('');
    };

    return (
        <div className="bg-ink-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-ink-600">Bạn thấy khóa học này thế nào?</p>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i)}
                    >
                        <Star
                            className={`w-6 h-6 transition-colors ${
                                i <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-ink-200'
                            }`}
                        />
                    </button>
                ))}
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về nội dung, giảng viên, bài tập..."
                rows={3}
                className="w-full resize-none bg-white border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
            />
            <div className="flex justify-end">
                <button
                    onClick={submit}
                    disabled={!rating || !content.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    Gửi đánh giá
                </button>
            </div>
        </div>
    );
};

const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { guardOpen, guardAction, closeGuard, requireAuth } = useAuthGuard();
    const user = useAuthStore((s) => s.user);

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [breakdown, setBreakdown] = useState<RatingBreakdown>(emptyBreakdown);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const { pendingCourse, enrolling, requestEnroll, cancelEnroll, confirmEnroll } = useEnrollFlow(setEnrollment);

    useEffect(() => {
        if (!courseId) return;
        (async () => {
            setLoading(true);
            try {
                const c = await courseService.getCourseById(courseId);
                setCourse(c);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [courseId]);

    const loadReviews = useCallback(() => {
        if (!courseId) return;
        Promise.all([
            reviewService.getReviews(Number(courseId)),
            reviewService.getSummary(Number(courseId)),
        ]).then(([r, s]) => {
            setReviews(r);
            setBreakdown(s);
        }).catch((e) => console.error(e));
    }, [courseId]);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    // Đã đăng ký hay chưa quyết định nhãn nút + có phải qua checkout không.
    // Endpoint cần auth nên khách vãng lai bỏ qua, họ sẽ bị AuthGuardModal chặn khi bấm.
    useEffect(() => {
        if (!courseId || !user) { setEnrollment(null); return; }
        let mounted = true;
        enrollmentService.getEnrollment(Number(courseId))
            .then((e) => { if (mounted) setEnrollment(e); })
            .catch((e) => console.error(e));
        return () => { mounted = false; };
    }, [courseId, user]);

    const isPro = (course?.price ?? 0) > 0;
    const isEnrolled = enrollment !== null;

    /**
     * Đã ghi danh → vào học thẳng.
     * Chưa ghi danh + có phí → CheckoutModal.
     * Chưa ghi danh + miễn phí → dialog xác nhận (ghi danh là hành động có chủ đích, không tự động).
     */
    const handleCta = () => requireAuth(
        () => {
            if (isEnrolled) { navigate(`/courses/${courseId}/learn`); return; }
            if (isPro) { setCheckoutOpen(true); return; }
            if (course) requestEnroll(course);
        },
        `${isPro ? 'mua' : 'đăng ký'} khóa học "${course?.title}"`,
    );

    /** Thanh toán hiện là mock; ghi danh mới là thứ thật sự được lưu xuống DB. */
    const handleCheckoutSuccess = async () => {
        if (!courseId) return;
        try {
            setEnrollment(await enrollmentService.enroll(Number(courseId)));
        } catch (e) {
            console.error(e);
            toast.error('Thanh toán xong nhưng chưa ghi danh được. Vui lòng thử lại.');
        }
    };

    const toggleHelpful = async (id: number) => {
        if (!courseId) return;
        try {
            const res = await reviewService.toggleHelpful(Number(courseId), id);
            setReviews((prev) => prev.map((r) =>
                r.id === id ? { ...r, markedHelpful: res.markedHelpful, helpfulCount: res.helpfulCount } : r
            ));
        } catch (e) { console.error(e); }
    };

    const submitReview = async (rating: number, content: string) => {
        if (!courseId) return;
        try {
            const created = await reviewService.createReview(Number(courseId), { rating, content });
            setReviews((prev) => [created, ...prev]);
            reviewService.getSummary(Number(courseId)).then(setBreakdown).catch((e) => console.error(e));
        } catch (e: any) {
            const msg = e?.response?.data?.errors?.courseId ?? 'Không thể gửi đánh giá. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    const addReply = async (reviewId: number, content: string) => {
        if (!courseId) return;
        try {
            const reply = await reviewService.addReply(Number(courseId), reviewId, content);
            setReviews((prev) => prev.map((r) => r.id === reviewId
                ? { ...r, replies: [...r.replies, reply] }
                : r
            ));
        } catch (e) {
            console.error(e);
            toast.error('Không thể gửi trả lời. Vui lòng thử lại.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-primary-600 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>

            {/* Course header */}
            <div className="bg-white rounded-2xl border border-ink-200 shadow-soft p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-ink-900 leading-snug mb-2">{course?.title ?? 'Khóa học'}</h1>
                        <p className="text-sm text-ink-500 leading-relaxed mb-3">{course?.description}</p>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-ink-500">
                            <div className="flex items-center gap-1.5">
                                <StarRow value={breakdown.average} />
                                <span className="font-semibold text-ink-800">{breakdown.average.toFixed(1)}</span>
                                <span className="text-ink-400">({breakdown.total} đánh giá)</span>
                            </div>
                            {course && course.totalDurationSeconds > 0 && (
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDurationSeconds(course.totalDurationSeconds)}</span>
                            )}
                            {course && course.lessonCount > 0 && (
                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.lessonCount} bài học</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
                        <span className={`text-lg font-extrabold ${isPro ? 'text-ink-900' : 'text-code-600'}`}>
                            {isPro ? `${course?.price.toLocaleString('vi-VN')}₫` : 'Miễn phí'}
                        </span>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCta}
                            disabled={enrolling}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {isEnrolled
                                ? (enrollment!.progress > 0 ? 'Tiếp tục học' : 'Vào học')
                                : (isPro ? 'Mua ngay' : 'Đăng ký khóa học')}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                        {isEnrolled && enrollment!.progress > 0 && (
                            <span className="text-[11px] font-medium text-primary-600">
                                Đã học {Math.round(enrollment!.progress)}%
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-ink-400">
                            <ShieldCheck className="w-3 h-3" /> Học không giới hạn thời gian
                        </span>
                    </div>
                </div>
                <AuthGuardModal isOpen={guardOpen} onClose={closeGuard} action={guardAction} />
                <CheckoutModal
                    isOpen={checkoutOpen}
                    onClose={() => setCheckoutOpen(false)}
                    title={course?.title ?? 'Khóa học'}
                    price={course?.price ?? 0}
                    onSuccess={handleCheckoutSuccess}
                    onEnterCourse={() => navigate(`/courses/${courseId}/learn`)}
                />
                <EnrollConfirmModal
                    course={pendingCourse}
                    loading={enrolling}
                    onCancel={cancelEnroll}
                    onConfirm={confirmEnroll}
                />
            </div>

            {/* Rating + reviews */}
            <div className="bg-white rounded-2xl border border-ink-200 shadow-soft p-6">
                <h2 className="text-base font-bold text-ink-900 mb-4">Đánh giá từ học viên</h2>

                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex flex-col items-center justify-center flex-shrink-0 md:w-40">
                        <span className="text-4xl font-extrabold text-ink-900">{breakdown.average.toFixed(1)}</span>
                        <StarRow value={breakdown.average} size={16} />
                        <span className="text-xs text-ink-400 mt-1">{breakdown.total} đánh giá</span>
                    </div>
                    <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                        {[5, 4, 3, 2, 1].map((s) => (
                            <RatingBar key={s} star={s} count={breakdown.distribution[s as 1 | 2 | 3 | 4 | 5]} total={breakdown.total} />
                        ))}
                    </div>
                </div>

                <div className="mb-2">
                    <ReviewForm onSubmit={submitReview} />
                </div>

                <div>
                    {reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} onToggleHelpful={toggleHelpful} onReply={addReply} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
