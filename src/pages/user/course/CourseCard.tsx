import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, BookOpen, Heart, ArrowRight, Crown, Zap } from 'lucide-react';
import { showToast } from '../../../components/CustomToast';
import AuthGuardModal from '../../../components/AuthGuardModal';
import EnrollConfirmModal from '../../../components/EnrollConfirmModal';
import CheckoutModal from '../../../components/CheckoutModal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import enrollmentService from '../../../services/enrollmentService';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { useEnrollFlow } from '../../../hooks/useEnrollFlow';
import { useSpotlight } from '../../../hooks/useSpotlight';
import { Course, formatDurationSeconds } from '../../../types/course';
import { cn } from '../../../lib/cn';

interface CourseCardProps {
    course: Course;
    variant: 'free' | 'pro';
}

/** Gradient thumbnail theo id — dùng chung với list view của CourseFinder. */
export const THUMBNAIL_GRADIENTS = [
    'from-indigo-500 via-violet-500 to-purple-600',
    'from-violet-500 via-fuchsia-500 to-pink-500',
    'from-emerald-500 via-teal-500 to-cyan-600',
    'from-rose-500 via-pink-500 to-fuchsia-500',
    'from-amber-400 via-orange-500 to-rose-500',
    'from-sky-500 via-blue-500 to-indigo-600',
];

const LEVEL: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' }> = {
    Beginner:     { label: 'Cơ bản',    variant: 'success' },
    Intermediate: { label: 'Trung cấp', variant: 'warning' },
    Advanced:     { label: 'Nâng cao',  variant: 'primary' },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

const CourseCard: React.FC<CourseCardProps> = ({ course, variant }) => {
    const [wishlisted, setWishlisted] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const navigate = useNavigate();
    const { guardOpen, guardAction, closeGuard, requireAuth } = useAuthGuard();
    const { pendingCourse, enrolling, requestEnroll, cancelEnroll, confirmEnroll } = useEnrollFlow();
    const { ref: spotRef, onMouseMove } = useSpotlight<HTMLElement>();

    const gradient = THUMBNAIL_GRADIENTS[course.id % THUMBNAIL_GRADIENTS.length];
    const level = LEVEL[course.level] ?? LEVEL.Beginner;
    const duration = formatDurationSeconds(course.totalDurationSeconds);
    const isPro = variant === 'pro';
    const featured = isPro && course.isFeatured;
    const showImage = !!course.imageUrl && !imgFailed;

    const openCourse = () => navigate(`/courses/${course.id}`);

    /** Thanh toán hiện là mock; ghi danh mới là thứ thật sự được lưu xuống DB. */
    const handleCheckoutSuccess = async () => {
        try {
            await enrollmentService.enroll(course.id);
        } catch (e) {
            console.error(e);
            showToast.error('Thanh toán xong nhưng chưa ghi danh được. Vui lòng vào trang chi tiết khóa học để thử lại.');
        }
    };

    return (
        <motion.article
            ref={spotRef}
            onMouseMove={onMouseMove}
            variants={cardVariants}
            whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
            className={cn(
                'spotlight group relative flex flex-col overflow-hidden rounded-2xl bg-surface',
                'border border-line shadow-card',
                'transition-[border-color,box-shadow] duration-300',
                'hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40',
                featured && 'ring-1 ring-primary-400/40 dark:ring-primary-500/30',
            )}
        >
            {/* ── Thumbnail ─────────────────────────────────────── */}
            <div
                onClick={openCourse}
                className="relative aspect-[16/9] overflow-hidden flex-shrink-0 cursor-pointer"
            >
                {showImage ? (
                    <img
                        src={course.imageUrl!}
                        alt={course.title}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                ) : (
                    <div className={cn('absolute inset-0 bg-gradient-to-br transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]', gradient)}>
                        <div
                            className="absolute inset-0 opacity-25"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                backgroundSize: '18px 18px',
                            }}
                        />
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-6xl font-black text-white/25 select-none leading-none drop-shadow-sm">
                                {course.title.charAt(0)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Overlay để badge dễ đọc */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-ink-950/10 pointer-events-none" />

                {/* Badge góc trên trái */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {featured && (
                        <Badge variant="glass" size="sm">
                            <Crown className="w-3 h-3" /> Featured
                        </Badge>
                    )}
                </div>

                {/* Wishlist — hiện khi hover / focus */}
                <button
                    onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
                    aria-label={wishlisted ? 'Bỏ lưu' : 'Lưu khóa học'}
                    aria-pressed={wishlisted}
                    className={cn(
                        'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center',
                        'bg-white/15 border border-white/25 backdrop-blur-md',
                        'transition-all duration-200 hover:bg-white/30 active:scale-90',
                        wishlisted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}
                >
                    <Heart className={cn('w-3.5 h-3.5 transition-colors', wishlisted ? 'text-rose-400 fill-rose-400' : 'text-white')} />
                </button>

                {/* Thời lượng góc dưới phải */}
                {course.totalDurationSeconds > 0 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ink-950/60 backdrop-blur-sm text-[11px] font-medium text-white">
                        <Clock className="w-3 h-3" /> {duration}
                    </span>
                )}
            </div>

            {/* ── Content ───────────────────────────────────────── */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                <div className="flex items-center justify-between gap-2">
                    <Badge variant={level.variant} size="sm" className="normal-case tracking-normal">{level.label}</Badge>
                    {isPro ? (
                        <Badge variant="gradient" size="sm"><Crown className="w-2.5 h-2.5" /> Pro</Badge>
                    ) : (
                        <Badge variant="success" size="sm"><Zap className="w-2.5 h-2.5" /> Miễn phí</Badge>
                    )}
                </div>

                <h3
                    onClick={openCourse}
                    className="text-[15px] font-bold text-fg line-clamp-2 leading-snug cursor-pointer transition-colors hover:text-primary-600 dark:hover:text-primary-300"
                >
                    {course.title}
                </h3>

                <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed flex-1">
                    {course.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-fg-subtle">
                    <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-fg-2">{course.rating.toFixed(1)}</span>
                    </span>
                    {course.lessonCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {course.lessonCount} bài
                        </span>
                    )}
                    {course.chapterCount > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1">
                            {course.chapterCount} chương
                        </span>
                    )}
                </div>

                <div className="h-px bg-line-2" />

                {/* Footer */}
                <div className="flex items-center justify-between gap-2">
                    {isPro ? (
                        <span className="text-base font-extrabold tracking-tight text-fg tabular-nums">
                            {course.price.toLocaleString('vi-VN')}<span className="text-xs font-bold text-fg-muted ml-0.5">₫</span>
                        </span>
                    ) : (
                        <span className="text-base font-extrabold tracking-tight text-code-600 dark:text-emerald-400">Miễn phí</span>
                    )}

                    <Button
                        size="sm"
                        variant={isPro ? 'primary' : 'soft'}
                        className="group/btn"
                        onClick={() => requireAuth(
                            // Khóa miễn phí đi qua dialog xác nhận; khóa có phí phải qua checkout trước.
                            () => isPro ? setCheckoutOpen(true) : requestEnroll(course),
                            `${isPro ? 'mua' : 'đăng ký'} khóa học "${course.title}"`
                        )}
                    >
                        {isPro ? 'Mua ngay' : 'Đăng ký học'}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                </div>
            </div>

            <AuthGuardModal isOpen={guardOpen} onClose={closeGuard} action={guardAction} />
            <EnrollConfirmModal
                course={pendingCourse}
                loading={enrolling}
                onCancel={cancelEnroll}
                onConfirm={confirmEnroll}
            />
            <CheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                title={course.title}
                price={course.price}
                onSuccess={handleCheckoutSuccess}
                onEnterCourse={() => navigate(`/courses/${course.id}/learn`)}
            />
        </motion.article>
    );
};

export default CourseCard;
