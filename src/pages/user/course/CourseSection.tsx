import React from 'react';
import { motion } from 'framer-motion';
import CourseCard from './CourseCard';
import { Course } from '../../../types/course';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

interface CourseSectionProps {
    title: string;
    subtitle: string;
    courses: Course[];
    variant: 'free' | 'pro';
    loading?: boolean;
}

const containerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
};

const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
        <div className="aspect-[16/9] bg-ink-100 shimmer" />
        <div className="p-4 space-y-3">
            <div className="flex justify-between">
                <div className="h-4 w-16 rounded-full bg-ink-100 shimmer" />
                <div className="h-4 w-12 rounded-full bg-ink-100 shimmer" />
            </div>
            <div className="h-4 w-3/4 rounded bg-ink-100 shimmer" />
            <div className="h-3 w-full rounded bg-ink-100 shimmer" />
            <div className="h-3 w-2/3 rounded bg-ink-100 shimmer" />
            <div className="h-px bg-ink-100" />
            <div className="flex justify-between items-center">
                <div className="h-5 w-16 rounded bg-ink-100 shimmer" />
                <div className="h-8 w-20 rounded-xl bg-ink-100 shimmer" />
            </div>
        </div>
    </div>
);

const CourseSection: React.FC<CourseSectionProps> = ({ title, subtitle, courses, variant, loading = false }) => {
    const isPro = variant === 'pro';

    return (
        <section className="mb-14">
            {/* Header */}
            <motion.div
                className="flex items-end justify-between mb-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="flex items-start gap-3">
                    {/* Animated accent bar */}
                    <motion.div
                        className={`mt-1 w-1 rounded-full flex-shrink-0 ${
                            isPro
                                ? 'bg-gradient-to-b from-primary-500 to-accent-500'
                                : 'bg-gradient-to-b from-code-400 to-code-600'
                        }`}
                        initial={{ height: 0 }}
                        whileInView={{ height: 32 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
                    />
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-xl font-extrabold text-ink-900">{title}</h2>
                            {isPro ? (
                                <motion.span
                                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white"
                                    animate={{ scale: [1, 1.07, 1] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Sparkles className="w-2.5 h-2.5" /> PREMIUM
                                </motion.span>
                            ) : (
                                <motion.span
                                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-code-50 text-code-700 border border-code-200"
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Zap className="w-2.5 h-2.5" /> FREE
                                </motion.span>
                            )}
                        </div>
                        <p className="text-sm text-ink-500">{subtitle}</p>
                    </div>
                </div>

                <motion.button
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors group flex-shrink-0"
                    whileHover={{ x: 2 }}
                >
                    Xem tất cả
                    <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ArrowRight className="w-3.5 h-3.5" />
                    </motion.span>
                </motion.button>
            </motion.div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : courses.length === 0 ? (
                <div className="py-12 text-center text-sm text-ink-400">Chưa có khóa học nào.</div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-60px' }}
                >
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} variant={variant} />
                    ))}
                </motion.div>
            )}
        </section>
    );
};

export default CourseSection;
