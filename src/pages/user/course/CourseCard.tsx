import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, BookOpen, Heart, ArrowRight, Crown, Zap } from 'lucide-react';
import AuthGuardModal from '../../../components/AuthGuardModal';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { Course, formatDurationSeconds } from '../../../types/course';

interface CourseCardProps {
    course: Course;
    variant: 'free' | 'pro';
}

const THUMBNAIL_GRADIENTS = [
    { from: '#4f46e5', to: '#7c3aed' },
    { from: '#7c3aed', to: '#6366f1' },
    { from: '#10b981', to: '#0d9488' },
    { from: '#f43f5e', to: '#ec4899' },
    { from: '#f59e0b', to: '#f97316' },
    { from: '#06b6d4', to: '#3b82f6' },
];

const LEVEL_CONFIG: Record<string, { label: string; className: string }> = {
    Beginner:     { label: 'Cơ bản',    className: 'bg-code-50 text-code-700 border border-code-200' },
    Intermediate: { label: 'Trung cấp', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    Advanced:     { label: 'Nâng cao',  className: 'bg-primary-50 text-primary-700 border border-primary-200' },
};

const CourseCard: React.FC<CourseCardProps> = ({ course, variant }) => {
    const [wishlisted, setWishlisted] = useState(false);
    const navigate = useNavigate();
    const { guardOpen, guardAction, closeGuard, requireAuth } = useAuthGuard();

    const g = THUMBNAIL_GRADIENTS[course.id % THUMBNAIL_GRADIENTS.length];
    const levelCfg = LEVEL_CONFIG[course.level] ?? LEVEL_CONFIG.Beginner;
    const duration = formatDurationSeconds(course.totalDurationSeconds);
    const isPro = variant === 'pro';

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 28 },
                show:   { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
            className={`group relative bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-[0_20px_48px_rgb(79_70_229/0.13)] ${
                isPro && course.isFeatured
                    ? 'border-primary-200 shadow-[0_0_0_1.5px_rgb(99_102_241/0.2)]'
                    : 'border-ink-200 shadow-soft'
            }`}
        >
            {/* ── Thumbnail ───────────────────────────────────────── */}
            <div
                onClick={() => navigate(`/courses/${course.id}`)}
                className="relative aspect-[16/9] overflow-hidden flex-shrink-0 cursor-pointer"
            >
                {course.imageUrl ? (
                    /* Real thumbnail — Ken Burns zoom */
                    <motion.img
                        src={course.imageUrl}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    /* Fallback: animated gradient */
                    <>
                        <motion.div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                            transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
                        />
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px',
                            }}
                        />
                        <motion.div
                            className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10 blur-lg"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                className="text-6xl font-black text-white/20 select-none leading-none"
                                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                                transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
                            >
                                {course.title.charAt(0)}
                            </motion.span>
                        </div>
                    </>
                )}

                {/* Shimmer sweep — luôn chạy */}
                <motion.div
                    className="absolute inset-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '450%'] }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
                />

                {/* Dark overlay khi có ảnh thật để badge dễ đọc */}
                {course.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Featured ribbon */}
                {isPro && course.isFeatured && (
                    <motion.div
                        className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full"
                        animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0.3)', '0 0 0 5px rgba(255,255,255,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Featured</span>
                    </motion.div>
                )}

                {/* Wishlist */}
                <button
                    onClick={() => setWishlisted(!wishlisted)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/40"
                >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${wishlisted ? 'text-rose-400 fill-rose-400' : 'text-white'}`} />
                </button>
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelCfg.className}`}>
                        {levelCfg.label}
                    </span>
                    {isPro ? (
                        <motion.span
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white"
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Crown className="w-2.5 h-2.5" /> PRO
                        </motion.span>
                    ) : (
                        <motion.span
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-code-50 text-code-700 border border-code-200"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Zap className="w-2.5 h-2.5" /> Miễn phí
                        </motion.span>
                    )}
                </div>

                {/* Title */}
                <h3
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug cursor-pointer hover:text-primary-600 transition-colors"
                >
                    {course.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed flex-1">
                    {course.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-ink-400">
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-ink-700">{course.rating.toFixed(1)}</span>
                    </div>
                    {course.totalDurationSeconds > 0 && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{duration}</span>
                        </div>
                    )}
                    {course.lessonCount > 0 && (
                        <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{course.lessonCount} bài</span>
                        </div>
                    )}
                </div>

                <div className="h-px bg-ink-100" />

                {/* Footer */}
                <div className="flex items-center justify-between gap-2">
                    <div>
                        {isPro ? (
                            <span className="text-base font-extrabold text-ink-900">
                                {course.price.toLocaleString('vi-VN')}₫
                            </span>
                        ) : (
                            <span className="text-base font-extrabold text-code-600">Miễn phí</span>
                        )}
                    </div>
                    <motion.button
                        onClick={() => requireAuth(
                            () => navigate(`/courses/${course.id}/learn`),
                            `${isPro ? 'mua' : 'học'} khóa học "${course.title}"`
                        )}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isPro
                                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:brightness-105 hover:shadow-md hover:shadow-primary-500/30'
                                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/30'
                        }`}
                    >
                        {isPro ? 'Mua ngay' : 'Học ngay'}
                        <ArrowRight className="w-3 h-3" />
                    </motion.button>

                    <AuthGuardModal
                        isOpen={guardOpen}
                        onClose={closeGuard}
                        action={guardAction}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default CourseCard;
