import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CourseSection from './user/course/CourseSection';
import { slides } from '../mockDatas/mockCourses';
import { Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import courseService from '../services/courseServices';
import { Course } from '../types/course';

const statsVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const statItem = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};

const HomePage: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [isHover, setIsHover] = useState(false);
    const [freeCourses, setFreeCourses] = useState<Course[]>([]);
    const [premiumCourses, setPremiumCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isHover) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isHover]);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const [freeRes, premiumRes] = await Promise.all([
                    courseService.getCourses({ count: true, filter: `Price eq 0`, top: 6 }),
                    courseService.getCourses({ count: true, filter: `Price gt 0`, top: 6 }),
                ]);
                setFreeCourses(freeRes.value);
                setPremiumCourses(premiumRes.value);
            } catch (err) {
                console.error('Failed to fetch courses', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const stats = [
        { icon: Users,      label: 'Học viên',  value: '12K+' },
        { icon: TrendingUp, label: 'Khóa học',  value: '500+' },
        { icon: Sparkles,   label: 'Đánh giá',  value: '4.9' },
        { icon: Zap,        label: 'Hoàn thành', value: '98%' },
    ];

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-60" />

            {/* Floating ambient blobs — always animating */}
            <motion.div
                className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary-400/15 blur-3xl pointer-events-none"
                animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent-400/12 blur-3xl pointer-events-none"
                animate={{ x: [0, -50, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
            />
            <motion.div
                className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-code-400/10 blur-3xl pointer-events-none"
                animate={{ x: [0, 40, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity, delay: 4 }}
            />

            <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* ── Hero Carousel ─────────────────────────────── */}
                <motion.section
                    className="mb-10"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <div
                        className="relative overflow-hidden rounded-2xl sm:rounded-3xl h-[200px] sm:h-[260px] lg:h-[280px] shadow-soft-lg border border-ink-200"
                        onMouseEnter={() => setIsHover(true)}
                        onMouseLeave={() => setIsHover(false)}
                    >
                        <div
                            className="flex transition-transform duration-700 ease-out h-full"
                            style={{ transform: `translateX(-${index * 100}%)` }}
                        >
                            {slides.map((slide, i) => (
                                <div
                                    key={i}
                                    className="min-w-full h-full flex items-center px-5 sm:px-10 lg:px-14 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)' }}
                                >
                                    {/* Animated blobs inside hero */}
                                    <motion.div
                                        className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute -bottom-32 -left-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl"
                                        animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
                                        transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                                    />

                                    {/* Shimmer sweep on hero */}
                                    <motion.div
                                        className="absolute inset-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                        animate={{ x: ['-100%', '600%'] }}
                                        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
                                    />

                                    <div className="absolute top-6 right-8 font-mono text-xs text-white/40 hidden lg:block">
                                        <span className="text-white/30">$</span> learn --next
                                    </div>

                                    <div className="relative z-10 max-w-2xl text-white">
                                        <motion.div
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4"
                                            animate={{ scale: [1, 1.04, 1] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Khám phá ngay</span>
                                        </motion.div>
                                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight drop-shadow-md">
                                            {slide.title}
                                        </h1>
                                        <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed line-clamp-2">
                                            {slide.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dots */}
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ── Stats ─────────────────────────────────────── */}
                <motion.section
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
                    variants={statsVariants}
                    initial="hidden"
                    animate="show"
                >
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={statItem}
                            whileHover={{ y: -4, boxShadow: '0 12px 28px rgb(79 70 229 / 0.12)' }}
                            className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft overflow-hidden relative"
                        >
                            {/* Subtle bg glow */}
                            <motion.div
                                className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-primary-100/60 blur-xl pointer-events-none"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                            />
                            <div className="relative flex items-center gap-3">
                                <motion.div
                                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center"
                                    animate={{ rotate: [0, 4, -4, 0] }}
                                    transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
                                >
                                    <stat.icon className="w-5 h-5 text-primary-600" />
                                </motion.div>
                                <div>
                                    <p className="text-2xl font-extrabold text-ink-900 leading-none font-mono">{stat.value}</p>
                                    <p className="text-xs text-ink-500 mt-1">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.section>

                {/* ── Course Sections ───────────────────────────── */}
                <CourseSection
                    title="Khóa học miễn phí"
                    subtitle="Bắt đầu học tập mà không cần chi tiêu"
                    courses={freeCourses}
                    variant="free"
                    loading={loading}
                />

                <CourseSection
                    title="Khóa học cao cấp"
                    subtitle="Các khóa học chất lượng cao cho những ai muốn phát triển"
                    courses={premiumCourses}
                    variant="pro"
                    loading={loading}
                />
            </div>
        </main>
    );
};

export default HomePage;
