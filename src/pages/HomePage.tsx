import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { Sparkles, Users, BookOpen, Star, Trophy, ArrowRight, Map, Flame, CheckCircle2 } from 'lucide-react';
import CourseSection from './user/course/CourseSection';
import { slides, freeCourses as mockFree, premiumCourses as mockPremium } from '../mockDatas/mockCourses';
import courseService from '../services/courseServices';
import { Course } from '../types/course';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { useMyActivity } from '../hooks/useMyActivity';
import { usePublicStats } from '../hooks/usePublicStats';
import type { PublicStats } from '../services/statsService';

const EASE = [0.16, 1, 0.3, 1] as const;

const HomePage: React.FC = () => {
    const [freeCourses, setFreeCourses] = useState<Course[]>([]);
    const [premiumCourses, setPremiumCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

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
                // Dev không có backend vẫn xem được layout thật của trang chủ.
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[HomePage] Backend không phản hồi — đang dùng dữ liệu mẫu (chỉ ở development).');
                    setFreeCourses(mockFree);
                    setPremiumCourses(mockPremium);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <main className="relative min-h-screen overflow-hidden">
            {/* Nền: grid mờ dần + 2 blob ambient rất chậm (chỉ 2, ở cấp trang) */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
            <motion.div
                className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-primary-400/15 dark:bg-primary-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
                className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-accent-400/12 dark:bg-accent-500/10 blur-3xl pointer-events-none"
                animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
                transition={{ duration: 32, ease: 'easeInOut', repeat: Infinity, delay: 3 }}
            />

            <div className="relative max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Hero />
                <Stats />

                <div id="courses" className="scroll-mt-24" />
                <CourseSection
                    title="Khóa học miễn phí"
                    subtitle="Bắt đầu học ngay, không cần thẻ tín dụng"
                    courses={freeCourses}
                    variant="free"
                    loading={loading}
                />

                <CourseSection
                    title="Khóa học cao cấp"
                    subtitle="Đi sâu vào thực chiến với dự án và chứng chỉ"
                    courses={premiumCourses}
                    variant="pro"
                    loading={loading}
                />
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────── */

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // Streak thật cho người đã đăng nhập; khách xem số minh họa
    const user = useAuthStore((s) => s.user);
    const { data: activity } = useMyActivity(30, !!user);
    const streak = user && activity ? activity.currentStreak : null;
    const { data: publicStats } = usePublicStats();

    useEffect(() => {
        if (paused) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
        return () => clearInterval(t);
    }, [paused]);

    const slide = slides[index];

    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative overflow-hidden rounded-3xl bg-ink-950 text-white shadow-[0_30px_80px_-30px_rgb(var(--color-primary-900)/0.7)] ring-1 ring-white/10 mb-8"
        >
            {/* Lớp nền: gradient 2 góc + grid trắng mờ + noise */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(var(--color-primary-600)/0.6),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgb(var(--color-accent-600)/0.5),transparent_55%)]" />
            <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
            <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay pointer-events-none" />
            <div className="absolute -top-28 left-1/3 w-80 h-80 rounded-full bg-accent-400/25 blur-3xl pointer-events-none" />

            <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center px-6 sm:px-10 lg:px-14 py-10 sm:py-12 lg:py-14">
                {/* ── Left: copy ── */}
                <div className="min-w-0">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: EASE }}
                        >
                            <Badge variant="glass" className="mb-4 gap-1.5 py-1.5 px-3">
                                <Sparkles className="w-3 h-3" />
                                {slide.eyebrow}
                            </Badge>
                            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
                                {slide.title}{' '}
                                <span className="bg-gradient-to-r from-primary-200 via-accent-200 to-white bg-clip-text text-transparent">
                                    {slide.highlight}
                                </span>
                            </h1>
                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/75 leading-relaxed max-w-xl">
                                {slide.desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Button
                            size="lg"
                            onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group"
                        >
                            Bắt đầu học miễn phí
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                        <Button size="lg" variant="onDark" onClick={() => navigate('/roadmap')}>
                            <Map className="w-4 h-4" />
                            Xem lộ trình
                        </Button>
                    </div>

                    {/* Social proof */}
                    <div className="mt-7 flex items-center gap-4">
                        <div className="flex -space-x-2.5">
                            {['An', 'Bao', 'Chi', 'Dung'].map((s) => (
                                <img
                                    key={s}
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`}
                                    alt=""
                                    loading="lazy"
                                    className="w-8 h-8 rounded-full ring-2 ring-ink-950 bg-ink-800"
                                />
                            ))}
                        </div>
                        <div className="text-xs sm:text-[13px] text-white/70 leading-tight">
                            {publicStats && publicStats.learners >= 10 ? (
                                <><span className="font-semibold text-white">{publicStats.learners.toLocaleString('vi-VN')}+</span> học viên đang học</>
                            ) : (
                                <>Tham gia cộng đồng học lập trình</>
                            )}
                            {publicStats && publicStats.averageRating > 0 && (
                                <>
                                    <span className="mx-1.5 text-white/30">·</span>
                                    <span className="inline-flex items-center gap-1 align-middle">
                                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                        <span className="font-semibold text-white">{publicStats.averageRating.toFixed(1)}</span>/5
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Dots */}
                    <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Slide">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`Slide ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Right: code window (lg+) ── */}
                <div className="hidden lg:block relative">
                    <motion.div
                        initial={{ opacity: 0, y: 24, rotate: 1 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                    >
                        <CodeWindow />
                    </motion.div>

                    {/* Chip: streak — nổi nhẹ */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                        transition={{ opacity: { delay: 0.5, duration: 0.3 }, scale: { delay: 0.5, duration: 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
                        className="absolute -top-4 -right-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
                    >
                        <span className="flex w-7 h-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-300">
                            <Flame className="w-4 h-4" />
                        </span>
                        <div className="leading-tight">
                            <p className="text-[11px] text-white/60">{streak !== null ? 'Streak của bạn' : 'Streak'}</p>
                            <p className="text-sm font-bold">
                                {streak === null ? '7 ngày 🔥' : streak > 0 ? `${streak} ngày 🔥` : 'Học hôm nay để bắt đầu'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Chip: tiến độ */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, y: [0, 6, 0] }}
                        transition={{ opacity: { delay: 0.65, duration: 0.3 }, scale: { delay: 0.65, duration: 0.3 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
                        className="absolute -bottom-5 -left-4 w-52 px-3.5 py-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
                    >
                        <div className="flex items-center justify-between text-[11px] text-white/70 mb-2">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Advanced React</span>
                            <span className="font-semibold text-white">12/24</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-primary-200"
                                initial={{ width: 0 }}
                                animate={{ width: '50%' }}
                                transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

/* Token màu cho CodeWindow — tô tay, không cần highlighter. */
type Tok = React.FC<{ children: React.ReactNode }>;
const K: Tok = ({ children }) => <span className="text-accent-300">{children}</span>;        // keyword
const F: Tok = ({ children }) => <span className="text-sky-300">{children}</span>;           // function
const S: Tok = ({ children }) => <span className="text-emerald-300">{children}</span>;       // string
const N: Tok = ({ children }) => <span className="text-amber-300">{children}</span>;         // number
const C: Tok = ({ children }) => <span className="text-white/35 italic">{children}</span>;   // comment
const P: Tok = ({ children }) => <span className="text-white/55">{children}</span>;          // punctuation

/** Cửa sổ code trang trí bên phải hero. */
const CodeWindow: React.FC = () => {
    const lines: React.ReactNode[] = [
        <C>{'// hooks/useProgress.ts'}</C>,
        <><K>import</K> <P>{'{'}</P> useState <P>{'}'}</P> <K>from</K> <S>"react"</S><P>;</P></>,
        <></>,
        <><K>export function</K> <F>useProgress</F><P>(</P>total<P>:</P> <K>number</K><P>) {'{'}</P></>,
        <>  <K>const</K> <P>[</P>done<P>,</P> setDone<P>] =</P> <F>useState</F><P>(</P><N>12</N><P>);</P></>,
        <>  <K>const</K> percent <P>=</P> Math<P>.</P><F>round</F><P>((</P>done <P>/</P> total<P>) *</P> <N>100</N><P>);</P></>,
        <></>,
        <>  <K>return</K> <P>{'{'}</P></>,
        <>    percent<P>,</P></>,
        <>    <F>complete</F><P>: () =&gt;</P> <F>setDone</F><P>((</P>d<P>) =&gt;</P> d <P>+</P> <N>1</N><P>),</P></>,
        // eslint-disable-next-line no-template-curly-in-string -- chuỗi hiển thị trang trí, không phải template
        <>    label<P>:</P> <S>{'`Đã học ${done}/${total} bài 🚀`'}</S><P>,</P></>,
        <>  <P>{'};'}</P></>,
        <><P>{'}'}</P><span className="inline-block w-[7px] h-[15px] align-text-bottom ml-0.5 bg-primary-200 animate-blink" /></>,
    ];

    return (
        <div className="relative rounded-2xl bg-ink-950/80 border border-white/10 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur-md overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 h-10 border-b border-white/10 bg-white/[0.03]">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 px-2.5 py-1 rounded-md bg-white/[0.06] text-[11px] font-mono text-white/70">useProgress.ts</span>
                <span className="ml-auto text-[10px] font-mono text-white/35">TypeScript</span>
            </div>

            <pre className="px-4 py-4 font-mono text-[12.5px] leading-[1.7] text-white/90 overflow-hidden">
                {lines.map((line, i) => (
                    <div key={i} className="flex">
                        <span className="w-6 mr-4 text-right text-white/25 select-none">{i + 1}</span>
                        <code className="whitespace-pre">{line}</code>
                    </div>
                ))}
            </pre>

            {/* Glow ở đáy */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary-500/15 to-transparent pointer-events-none" />
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Stats — số đếm lên khi cuộn tới (NumberFlow)
   ───────────────────────────────────────────────────────────── */

interface Stat {
    icon: typeof Users;
    label: string;
    value: number;
    suffix?: string;
    format?: Intl.NumberFormatOptions;
}

/** Số ≥ 1000 → "12K+", dưới đó hiện chính xác (không "+" cho số nhỏ). */
const bigNumber = (n: number): Pick<Stat, 'value' | 'suffix' | 'format'> =>
    n >= 1000
        ? { value: n, suffix: '+', format: { notation: 'compact', maximumFractionDigits: 1 } }
        : { value: n };

/** Dựng 4 ô từ số liệu thật; khi chưa có review thì ô rating đổi thành số bài học. */
const buildStats = (s: PublicStats): Stat[] => [
    { icon: Users,    label: 'Học viên', ...bigNumber(s.learners) },
    { icon: BookOpen, label: 'Khóa học', ...bigNumber(s.activeCourses) },
    s.averageRating > 0
        ? { icon: Star,     label: 'Đánh giá trung bình', value: s.averageRating, format: { minimumFractionDigits: 1, maximumFractionDigits: 1 } }
        : { icon: BookOpen, label: 'Bài học', ...bigNumber(s.lessons) },
    { icon: Trophy,   label: 'Tỉ lệ hoàn thành', value: s.completionRate, suffix: '%', format: { maximumFractionDigits: 0 } },
];

const Stats: React.FC = () => {
    const { data } = usePublicStats();
    // Production không có số liệu → ẩn khối này thay vì hiện số giả
    if (!data) return null;
    return <StatsGrid stats={buildStats(data)} />;
};

/**
 * Tách riêng để useInView gắn observer đúng lúc element mount — nếu gọi useInView ở Stats
 * (lúc còn chờ API và return null) thì ref rỗng, observer không bao giờ gắn, khối ẩn mãi.
 */
const StatsGrid: React.FC<{ stats: Stat[] }> = ({ stats: STATS }) => {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.section
            ref={ref}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
        >
            {STATS.map((stat) => (
                <motion.div
                    key={stat.label}
                    variants={{
                        hidden: { opacity: 0, y: 18, scale: 0.97 },
                        show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40"
                >
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary-500/10 blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-white flex items-center justify-center shadow-glow-primary flex-shrink-0">
                            <stat.icon className="w-5 h-5" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                            <NumberFlow
                                value={inView ? stat.value : 0}
                                suffix={stat.suffix}
                                format={stat.format}
                                locales="en-US"
                                className="block text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-fg leading-none"
                            />
                            <p className="text-xs text-fg-muted mt-1.5 truncate">{stat.label}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.section>
    );
};

export default HomePage;
