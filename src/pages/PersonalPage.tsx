import React, { useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence, Variants } from 'framer-motion';
import { Trash2, Search, Zap, Plus } from 'lucide-react';
import { browsingHistory, personalInfo, BrowsingHistoryItem, generateContributionData } from '../mockDatas/mockBrowsingHistory';
import { useAuthStore } from '../stores/authStore';
import { ContributionGraph } from "../components/ContributionGraph";
import { StatCard } from "../components/StatCard";
import { HistoryItem } from "../components/HistoryItem";

// ---- Animation variants ---------------------------------------------------
const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const card: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 24 },
    },
};

const pop: Variants = {
    hidden: { opacity: 0, scale: 0.6 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 18 } },
};

// Reusable hover for cards (showy: lift + shadow + slight scale)
const hoverLift = {
    y: -6,
    scale: 1.015,
    boxShadow: '0 18px 40px rgb(79 70 229 / 0.12)',
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

// ---- 3D tilt card that follows the mouse + spotlight glow ------------------
const TiltCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 18 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 18 });
    // spotlight position
    const px = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
    const py = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
    const spotlight = useMotionTemplate`radial-gradient(220px circle at ${px} ${py}, rgb(99 102 241 / 0.10), transparent 70%)`;

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
    };
    const reset = () => { x.set(0); y.set(0); };

    return (
        <motion.div
            variants={card}
            onMouseMove={handleMove}
            onMouseLeave={reset}
            style={{ rotateX, rotateY, transformPerspective: 900 }}
            whileHover={{ y: -6, boxShadow: '0 22px 50px rgb(79 70 229 / 0.16)' }}
            className={`relative ${className ?? ''}`}
        >
            <motion.div className="pointer-events-none absolute inset-0 rounded-xl" style={{ background: spotlight }} />
            <div style={{ transform: 'translateZ(40px)' }} className="relative h-full">{children}</div>
        </motion.div>
    );
};

// ---- Sparkles that twinkle around an element -------------------------------
const Sparkles: React.FC = () => {
    const dots = [
        { top: '-6px', left: '10%', d: 0 },
        { top: '50%', left: '-8px', d: 0.4 },
        { top: '-4px', right: '20%', d: 0.8 },
        { bottom: '-6px', left: '40%', d: 1.2 },
        { top: '40%', right: '-6px', d: 1.6 },
    ];
    return (
        <>
            {dots.map((s, i) => (
                <motion.span
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-orange-400"
                    style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom } as React.CSSProperties}
                    animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.6, delay: s.d, repeat: Infinity, repeatDelay: 0.6 }}
                />
            ))}
        </>
    );
};

// ---- Animated number counter ---------------------------------------------
const AnimatedNumber: React.FC<{ value: number; format?: (n: number) => string }> = ({ value, format }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 80, damping: 20 });
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        if (inView) mv.set(value);
    }, [inView, value, mv]);

    useEffect(() => {
        return spring.on('change', (v) => {
            setDisplay(format ? format(Math.round(v)) : Math.round(v).toLocaleString());
        });
    }, [spring, format]);

    return <span ref={ref}>{display}</span>;
};

const PersonalPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const displayName = user?.name || user?.email || personalInfo.name;
    const displayEmail = user?.email || personalInfo.email;
    const avatarSeed = encodeURIComponent(displayName);

    const [history, setHistory] = useState<BrowsingHistoryItem[]>(browsingHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [contributionData] = useState(generateContributionData());

    const filteredHistory = history
        .filter(item => item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime())
        .slice(0, 5);

    const handleClearHistory = () => {
        if (window.confirm('Clear all activity?')) setHistory([]);
    };

    const handleDeleteItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    };

    return (
        <main className="min-h-screen bg-ink-50 relative overflow-hidden">
            {/* Animated gradient mesh + grid background */}
            <motion.div
                className="absolute inset-0 bg-gradient-mesh pointer-events-none"
                style={{ backgroundSize: '180% 180%' }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />

            {/* Floating color blobs */}
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
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6"
            >
                {/* Page header */}
                <motion.section variants={card}>
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>personal</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <motion.h1
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                        style={{ backgroundSize: '200% auto' }}
                        animate={{ backgroundPosition: ['0% center', '200% center'] }}
                        transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                    >
                        Trang cá nhân
                    </motion.h1>
                </motion.section>

                {/* TOP GRID: PROFILE & ACHIEVEMENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. PROFILE CARD */}
                    <TiltCard className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-6 overflow-hidden">
                        {/* shimmer sweep */}
                        <motion.div
                            className="pointer-events-none absolute top-0 -left-1/3 w-1/3 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            animate={{ left: ['-40%', '140%'] }}
                            transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.5 }}
                        />
                        <motion.img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                            alt={displayName}
                            className="w-20 h-20 rounded-full border border-slate-100 shadow-sm"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                            whileHover={{ scale: 1.08, rotate: 3 }}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                                <motion.span
                                    className="relative px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full border border-orange-100 flex items-center gap-1"
                                    animate={{ boxShadow: ['0 0 0 0 rgb(251 146 60 / 0.5)', '0 0 0 8px rgb(251 146 60 / 0)'] }}
                                    transition={{ duration: 2, ease: 'easeOut', repeat: Infinity }}
                                >
                                    <Sparkles />
                                    <motion.span
                                        animate={{ scale: [1, 1.25, 1] }}
                                        transition={{ duration: 1.4, repeat: Infinity }}
                                        className="flex items-center"
                                    >
                                        <Zap className="w-3 h-3 fill-current" />
                                    </motion.span>
                                    {personalInfo.streak} DAYS
                                </motion.span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">{displayEmail}</p>
                            <p className="text-sm text-slate-400 mt-2 line-clamp-1">{personalInfo.bio}</p>
                        </div>
                    </TiltCard>

                    {/* 2. ACHIEVEMENTS CARD */}
                    <TiltCard className="bg-white border border-slate-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Achievements</h3>
                            <span className="text-xs font-bold text-blue-600">
                                <AnimatedNumber value={personalInfo.points} /> pts
                            </span>
                        </div>
                        <motion.div
                            className="flex flex-wrap gap-2"
                            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                        >
                            {personalInfo.achievements.map((ach, idx) => (
                                <motion.span
                                    key={idx}
                                    variants={pop}
                                    whileHover={{ scale: 1.12, y: -2 }}
                                    className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-100 cursor-default"
                                >
                                    {ach.name}
                                </motion.span>
                            ))}
                        </motion.div>
                    </TiltCard>
                </div>

                {/* MIDDLE GRID: STATS & SKILLS & ACTIVITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 3. STATS CARD */}
                    <motion.div variants={card} className="space-y-4">
                        <motion.div whileHover={hoverLift}>
                            <StatCard label="Total study time" value={personalInfo.totalStudyTime} />
                        </motion.div>
                        <motion.div whileHover={hoverLift}>
                            <StatCard label="Lessons completed" value={personalInfo.totalCoursesCompleted} />
                        </motion.div>
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div whileHover={hoverLift}>
                                <StatCard label="Rate" value={`${personalInfo.completionRate}%`} />
                            </motion.div>
                            <motion.div whileHover={hoverLift}>
                                <StatCard label="Rank" value={personalInfo.rank.split(' ')[0]} />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* 4. SKILLS PROGRESS */}
                    <motion.div
                        variants={card}
                        whileHover={hoverLift}
                        className="bg-white border border-slate-200 rounded-xl p-6"
                    >
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">Skills Progress</h3>
                        <div className="space-y-5">
                            {personalInfo.skills.map((skill, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-700">{skill.name}</span>
                                        <span className="text-slate-400">{skill.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="relative h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full overflow-hidden"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.progress}%` }}
                                            viewport={{ once: true, margin: '-40px' }}
                                            transition={{ duration: 1.1, ease: 'easeOut', delay: idx * 0.12 }}
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5, delay: 1 }}
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 6. RECENT ACTIVITY CARD */}
                    <motion.div
                        variants={card}
                        className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input
                                        type="text"
                                        className="pl-6 py-1 text-[10px] bg-slate-50 border border-slate-100 rounded-md focus:outline-none w-24 focus:ring-2 focus:ring-primary-100 transition-all"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <motion.button
                                    onClick={handleClearHistory}
                                    whileHover={{ scale: 1.2, rotate: -8 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-slate-300 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                            </div>
                        </div>
                        <div className="flex-1 divide-y divide-slate-50 overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {filteredHistory.map(item => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16, height: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                                    >
                                        <HistoryItem
                                            item={item}
                                            formatDate={formatDate}
                                            onDelete={handleDeleteItem}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                {/* 5. CONTRIBUTION GRAPH - FULL WIDTH */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <ContributionGraph contributions={contributionData} />
                </motion.section>

                {/* 7. EXTENSIBILITY (Modular Cards) */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-60px' }}
                >
                    {[
                        { title: 'Add Certificates', desc: 'Show off your verified skills' },
                        { title: 'Add Leaderboard', desc: 'See how you rank in the community' },
                        { title: 'AI Recommendations', desc: 'Personalized paths for your goals' },
                    ].map((c) => (
                        <motion.div
                            key={c.title}
                            variants={card}
                            whileHover={{
                                y: -8,
                                borderColor: 'rgb(165 180 252)',
                                boxShadow: '0 20px 44px rgb(79 70 229 / 0.15)',
                            }}
                            className="bg-white border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group cursor-pointer"
                        >
                            <motion.div
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </motion.div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                                <p className="text-xs text-slate-500">{c.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

            </motion.div>
        </main>
    );
};

export default PersonalPage;
