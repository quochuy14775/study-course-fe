import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Clock, PlayCircle, CheckCircle2,
    TrendingUp, Flame, Star, Award,
    Search, Filter, ArrowRight,
} from 'lucide-react';
import courseService from '../../../services/courseServices';
import { Course, formatDurationSeconds } from '../../../types/course';

// ── Animation variants (mirror PersonalPage) ─────────────────────────────────

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const cardVariant: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 24 },
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'inprogress' | 'completed';

const LEVEL_CONFIG: Record<string, { label: string; className: string }> = {
    Beginner:     { label: 'Cơ bản',    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    Intermediate: { label: 'Trung cấp', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    Advanced:     { label: 'Nâng cao',  className: 'bg-primary-50 text-primary-700 border border-primary-200' },
};

const THUMBNAIL_GRADIENTS = [
    { from: '#4f46e5', to: '#7c3aed' },
    { from: '#7c3aed', to: '#6366f1' },
    { from: '#10b981', to: '#0d9488' },
    { from: '#f43f5e', to: '#ec4899' },
    { from: '#f59e0b', to: '#f97316' },
    { from: '#06b6d4', to: '#3b82f6' },
];

// Mock progress per course id (until enrollment API is ready)
const mockProgress = (id: number) => {
    const seed = (id * 137 + 29) % 100;
    return seed;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
        <div className="aspect-[16/9] bg-ink-100 animate-shimmer" />
        <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-ink-100 animate-shimmer" />
            <div className="h-3 w-full rounded bg-ink-100 animate-shimmer" />
            <div className="h-2 w-full rounded-full bg-ink-100 animate-shimmer" />
            <div className="flex justify-between items-center">
                <div className="h-5 w-16 rounded bg-ink-100 animate-shimmer" />
                <div className="h-8 w-24 rounded-xl bg-ink-100 animate-shimmer" />
            </div>
        </div>
    </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatItem {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    bg: string;
}

const StatCard: React.FC<StatItem> = ({ icon: Icon, label, value, color, bg }) => (
    <motion.div
        variants={cardVariant}
        whileHover={{ y: -4, boxShadow: '0 14px 32px rgb(79 70 229 / 0.12)' }}
        className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft relative overflow-hidden"
    >
        <motion.div
            className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl pointer-events-none"
            style={{ background: bg }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
        />
        <div className="relative flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} bg-opacity-20`}
                style={{ background: bg }}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
                <p className="text-2xl font-extrabold text-ink-900 leading-none font-mono">{value}</p>
                <p className="text-xs text-ink-500 mt-1">{label}</p>
            </div>
        </div>
    </motion.div>
);

// ── Course card (my-courses variant with progress) ────────────────────────────

const MyCourseCard: React.FC<{ course: Course; progress: number }> = ({ course, progress }) => {
    const navigate = useNavigate();
    const g = THUMBNAIL_GRADIENTS[course.id % THUMBNAIL_GRADIENTS.length];
    const levelCfg = LEVEL_CONFIG[course.level] ?? LEVEL_CONFIG.Beginner;
    const isCompleted = progress === 100;
    const duration = formatDurationSeconds(course.totalDurationSeconds);

    return (
        <motion.div
            variants={cardVariant}
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
            className="group relative bg-white rounded-2xl border border-ink-200 overflow-hidden flex flex-col shadow-soft hover:shadow-[0_20px_48px_rgb(79_70_229/0.13)] transition-shadow duration-300"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
                {course.imageUrl ? (
                    <motion.img
                        src={course.imageUrl}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
                    />
                ) : (
                    <>
                        <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                        />
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px',
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-black text-white/20 select-none">
                                {course.title.charAt(0)}
                            </span>
                        </div>
                    </>
                )}

                {/* Shimmer sweep */}
                <motion.div
                    className="absolute inset-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '450%'] }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
                />

                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Completed badge */}
                {isCompleted && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white">Hoàn thành</span>
                    </div>
                )}

                {/* Progress ring in corner */}
                <div className="absolute bottom-3 right-3 w-9 h-9">
                    <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                        <motion.circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke={isCompleted ? '#10b981' : '#818cf8'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 15}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                            whileInView={{
                                strokeDashoffset: 2 * Math.PI * 15 * (1 - progress / 100),
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                        {progress}%
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4 gap-2.5">
                {/* Level badge */}
                <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelCfg.className}`}>
                    {levelCfg.label}
                </span>

                {/* Title */}
                <h3 className="text-sm font-bold text-ink-900 line-clamp-2 leading-snug">
                    {course.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-ink-400 mt-auto">
                    {course.totalDurationSeconds > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{duration}
                        </span>
                    )}
                    {course.lessonCount > 0 && (
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />{course.lessonCount} bài
                        </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-ink-700">{course.rating.toFixed(1)}</span>
                    </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-ink-400">
                        <span>Tiến độ</span>
                        <span className="font-semibold text-ink-600">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${
                                isCompleted
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-primary-500 to-accent-500'
                            }`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                <div className="h-px bg-ink-100" />

                {/* CTA */}
                <motion.button
                    onClick={() => navigate(`/courses/${course.id}/learn`)}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:brightness-105 hover:shadow-md hover:shadow-primary-500/30 transition-all"
                >
                    {isCompleted ? (
                        <><Award className="w-3.5 h-3.5" /> Xem lại</>
                    ) : progress > 0 ? (
                        <><PlayCircle className="w-3.5 h-3.5" /> Tiếp tục học</>
                    ) : (
                        <><PlayCircle className="w-3.5 h-3.5" /> Bắt đầu học</>
                    )}
                    <ArrowRight className="w-3 h-3" />
                </motion.button>
            </div>
        </motion.div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const MyCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<FilterTab>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let mounted = true;
        courseService.getCourses({ count: true, top: 20 })
            .then((res) => { if (mounted) setCourses(res.value ?? []); })
            .catch(() => { if (mounted) setCourses([]); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const withProgress = useMemo(
        () => courses.map((c) => ({ course: c, progress: mockProgress(c.id) })),
        [courses],
    );

    const filtered = useMemo(() => {
        let list = withProgress;
        if (tab === 'inprogress') list = list.filter((x) => x.progress > 0 && x.progress < 100);
        if (tab === 'completed')  list = list.filter((x) => x.progress === 100);
        if (search.trim()) list = list.filter((x) => x.course.title.toLowerCase().includes(search.toLowerCase()));
        return list;
    }, [withProgress, tab, search]);

    const stats = useMemo(() => ({
        total:      withProgress.length,
        inprogress: withProgress.filter((x) => x.progress > 0 && x.progress < 100).length,
        completed:  withProgress.filter((x) => x.progress === 100).length,
        hours:      Math.round(courses.reduce((s, c) => s + c.totalDurationSeconds, 0) / 3600),
    }), [withProgress, courses]);

    const TABS: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all',        label: 'Tất cả',      count: stats.total },
        { key: 'inprogress', label: 'Đang học',     count: stats.inprogress },
        { key: 'completed',  label: 'Hoàn thành',   count: stats.completed },
    ];

    const STATS: StatItem[] = [
        { icon: BookOpen,    label: 'Đã đăng ký',   value: stats.total,      color: 'text-primary-600', bg: 'rgba(99,102,241,0.1)' },
        { icon: Flame,       label: 'Đang học',      value: stats.inprogress, color: 'text-amber-600',   bg: 'rgba(245,158,11,0.1)' },
        { icon: CheckCircle2,label: 'Hoàn thành',    value: stats.completed,  color: 'text-emerald-600', bg: 'rgba(16,185,129,0.1)' },
        { icon: Clock,       label: 'Giờ học',       value: `${stats.hours}h`,color: 'text-accent-600',  bg: 'rgba(124,58,237,0.1)' },
    ];

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            {/* ── Background — mirror PersonalPage ── */}
            <motion.div
                className="absolute inset-0 bg-gradient-mesh pointer-events-none"
                style={{ backgroundSize: '180% 180%' }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />

            <motion.div
                className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-400/20 blur-3xl pointer-events-none"
                animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-code-400/15 blur-3xl pointer-events-none"
                animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
            />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8"
            >
                {/* ── Page header ── */}
                <motion.section variants={cardVariant}>
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>my-courses</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <motion.h1
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                        style={{ backgroundSize: '200% auto' }}
                        animate={{ backgroundPosition: ['0% center', '200% center'] }}
                        transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                    >
                        Khóa học của tôi
                    </motion.h1>
                    <p className="text-sm text-ink-500 mt-1">Tiếp tục hành trình học tập của bạn</p>
                </motion.section>

                {/* ── Stats ── */}
                <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    variants={container}
                >
                    {STATS.map((s) => <StatCard key={s.label} {...s} />)}
                </motion.div>

                {/* ── Filter + Search bar ── */}
                <motion.div variants={cardVariant} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-white border border-ink-200 rounded-2xl shadow-soft flex-shrink-0">
                        {TABS.map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                    tab === key
                                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm'
                                        : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                                }`}
                            >
                                {label}
                                {count > 0 && (
                                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        tab === key ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm khóa học..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-2xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 shadow-soft transition-all"
                        />
                    </div>

                    {/* Result count */}
                    <span className="text-xs text-ink-400 font-mono flex-shrink-0 flex items-center gap-1">
                        <Filter size={11} />
                        {filtered.length} khóa học
                    </span>
                </motion.div>

                {/* ── Course grid ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        variants={cardVariant}
                        className="bg-white border border-dashed border-ink-300 rounded-2xl py-20 flex flex-col items-center gap-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-ink-700">
                                {tab === 'completed' ? 'Chưa hoàn thành khóa học nào' :
                                 tab === 'inprogress' ? 'Chưa có khóa học đang học' :
                                 'Bạn chưa đăng ký khóa học nào'}
                            </p>
                            <p className="text-sm text-ink-400 mt-1">Khám phá kho khóa học và bắt đầu ngay hôm nay</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl shadow-glow-primary"
                            onClick={() => window.location.href = '/'}
                        >
                            Khám phá khóa học <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab + search}
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {filtered.map(({ course, progress }) => (
                                <MyCourseCard key={course.id} course={course} progress={progress} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* ── Explore more CTA ── */}
                {!loading && filtered.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-7 text-white text-center shadow-soft-lg"
                    >
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-3">
                                <TrendingUp className="w-3 h-3" />
                                Khám phá thêm
                            </div>
                            <p className="text-xl font-extrabold mb-1">Mở rộng kỹ năng của bạn</p>
                            <p className="text-white/70 text-sm mb-4">Hàng trăm khóa học mới đang chờ bạn</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => window.location.href = '/'}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl shadow-soft-lg text-sm"
                            >
                                Khám phá ngay <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </main>
    );
};

export default MyCoursesPage;
