import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Inbox } from 'lucide-react';
import CourseCard from './CourseCard';
import { Course } from '../../../types/course';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';

interface CourseSectionProps {
    title: string;
    subtitle: string;
    courses: Course[];
    variant: 'free' | 'pro';
    loading?: boolean;
    onViewAll?: () => void;
}

const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-card">
        <div className="aspect-[16/9] shimmer" />
        <div className="p-4 space-y-3">
            <div className="flex justify-between">
                <div className="h-4 w-16 rounded-full shimmer" />
                <div className="h-4 w-12 rounded-full shimmer" />
            </div>
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-3 w-full rounded shimmer" />
            <div className="h-3 w-2/3 rounded shimmer" />
            <div className="h-px bg-line-2" />
            <div className="flex justify-between items-center">
                <div className="h-5 w-16 rounded shimmer" />
                <div className="h-8 w-24 rounded-lg shimmer" />
            </div>
        </div>
    </div>
);

const CourseSection: React.FC<CourseSectionProps> = ({ title, subtitle, courses, variant, loading = false, onViewAll }) => {
    const isPro = variant === 'pro';
    const Icon = isPro ? Sparkles : Zap;

    return (
        <section className="mb-14">
            {/* Header */}
            <motion.div
                className="flex items-end justify-between gap-4 mb-6"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    <div
                        className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white',
                            isPro
                                ? 'bg-gradient-to-br from-primary-500 to-accent-600 shadow-glow-primary'
                                : 'bg-gradient-to-br from-code-400 to-code-600 shadow-[0_0_20px_rgb(16_185_129/0.35)]',
                        )}
                    >
                        <Icon className="w-5 h-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl font-extrabold tracking-tight text-fg leading-tight">{title}</h2>
                        <p className="text-sm text-fg-muted mt-0.5 truncate">{subtitle}</p>
                    </div>
                </div>

                {onViewAll && (
                    <Button variant="ghost" size="sm" onClick={onViewAll} className="group flex-shrink-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10">
                        Xem tất cả
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                )}
            </motion.div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-line text-center">
                    <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-subtle mb-3">
                        <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-fg-2">Chưa có khóa học nào</p>
                    <p className="text-xs text-fg-subtle mt-1">Quay lại sau nhé, nội dung mới đang được thêm.</p>
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    variants={gridVariants}
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
