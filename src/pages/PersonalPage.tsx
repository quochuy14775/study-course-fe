import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, BookOpen, Award, Target, Play, ArrowRight, FlaskConical, Lock, Star,
    CheckCircle2, XCircle, UserPlus, Settings, Calendar, Flame, Code2, Activity, Terminal,
    GitBranch, GitCommitHorizontal, FolderOpen, LayoutGrid, Medal, Crown, Gem, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMyActivity } from '../hooks/useMyActivity';
import { useMyOverview } from '../hooks/useMyOverview';
import { ContributionGraph, type ContributionDay } from '../components/ContributionGraph';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { MacWindow } from '../components/ui/MacWindow';
import { PageTitle } from '../components/ui/PageTitle';
import { TermCommand, TermBar, TermStatGrid, type TermStatItem } from '../components/ui/Terminal';
import { container, card, fmtStudyTime, timeAgo } from '../components/profile/ProfileKit';
import AdminProfilePage from './AdminProfilePage';
import { cn } from '../lib/cn';
import type { Achievement, ContinueCourse, MyCertificate, RankId, RecentEvent, SkillProgress, UserOverview } from '../types/userOverview';

/* ─────────────────────────────────────────────────────────────
   Bảng tra
   ───────────────────────────────────────────────────────────── */

const RANK_ORDER: RankId[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

/** Chất liệu từng hạng: gradient kim loại + icon + màu chữ đi kèm. Bar tiến độ dùng tone gần nhất của TermBar. */
const RANK_MATERIAL: Record<RankId, { icon: LucideIcon; metal: string; text: string; bar: 'amber' | 'sky' | 'primary' }> = {
    bronze:   { icon: Medal, metal: 'from-amber-500 via-orange-700 to-amber-900',  text: 'text-amber-700 dark:text-amber-500',      bar: 'amber' },
    silver:   { icon: Medal, metal: 'from-slate-100 via-slate-400 to-slate-600',   text: 'text-slate-500 dark:text-slate-300',      bar: 'sky' },
    gold:     { icon: Medal, metal: 'from-yellow-200 via-amber-400 to-yellow-700', text: 'text-yellow-600 dark:text-yellow-400',    bar: 'amber' },
    platinum: { icon: Crown, metal: 'from-white via-sky-200 to-slate-400',         text: 'text-sky-600 dark:text-sky-200',          bar: 'sky' },
    diamond:  { icon: Gem,   metal: 'from-cyan-100 via-violet-300 to-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-300',  bar: 'primary' },
};

/** Huy hiệu kim loại nhỏ, inline với text mono. Sheen = viền sáng trên + tối dưới như bề mặt kim loại. */
const RankBadge: React.FC<{ id: RankId; className?: string }> = ({ id, className }) => {
    const m = RANK_MATERIAL[id];
    return (
        <span
            className={cn(
                'inline-flex w-[18px] h-[18px] items-center justify-center rounded-[5px] align-[-4px] bg-gradient-to-br ring-1 ring-black/15 dark:ring-white/15',
                'shadow-[inset_0_1px_0_rgb(255_255_255/0.75),inset_0_-1px_1px_rgb(0_0_0/0.35),0_1px_2px_rgb(0_0_0/0.25)]',
                m.metal, className,
            )}
            aria-hidden
        >
            <m.icon className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.55)]" strokeWidth={2.5} />
        </span>
    );
};

const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
    'first-lesson': BookOpen, 'lessons-25': BookOpen, 'lessons-100': BookOpen,
    'streak-7': Flame, 'streak-30': Flame,
    'quiz-10': Target, 'perfect-score': Star,
    'first-cert': Award, 'certs-5': Award,
    'active-100': Calendar,
};

const EVENT_META: Record<RecentEvent['kind'], { icon: LucideIcon; label: string; cls: string }> = {
    lesson: { icon: CheckCircle2, label: 'Hoàn thành bài', cls: 'text-primary-600 dark:text-primary-300' },
    quiz:   { icon: Target,       label: 'Làm quiz',       cls: 'text-amber-600 dark:text-amber-400' },
    cert:   { icon: Award,        label: 'Chứng chỉ',      cls: 'text-emerald-600 dark:text-emerald-400' },
    enroll: { icon: UserPlus,     label: 'Ghi danh',       cls: 'text-fg-muted' },
};

const LEVEL = {
    Beginner:     { label: 'Cơ bản',    dot: '#10b981' },
    Intermediate: { label: 'Trung cấp', dot: '#f59e0b' },
    Advanced:     { label: 'Nâng cao',  dot: '#8b5cf6' },
} as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

/* ─────────────────────────────────────────────────────────────
   Page — admin không học nên có trang riêng
   ───────────────────────────────────────────────────────────── */

const PersonalPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    if (user?.role === 'Admin') return <AdminProfilePage />;
    return <LearnerProfile />;
};

const LearnerProfile: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const overview = useMyOverview();
    const activity = useMyActivity(365);
    const data = overview.data;

    const contributionData = useMemo<ContributionDay[]>(
        () => (activity.data?.days ?? []).map((d) => ({
            date: new Date(`${d.date}T00:00:00`), // không có Z → theo giờ máy, đúng ngày BE trả
            count: d.count, lessons: d.lessons, quizzes: d.quizzes, posts: d.posts,
            enrollments: d.enrollments, certificates: d.certificates,
        })),
        [activity.data],
    );

    const streak = data?.currentStreak ?? activity.data?.currentStreak ?? 0;
    const streakAtRisk = streak > 0 && !(data?.streakSafeToday ?? activity.data?.streakSafeToday ?? true);
    const isMock = overview.source === 'mock' || activity.source === 'mock';

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6"
            >
                <motion.div variants={card}>
                    <PageTitle
                        path="personal"
                        title="Trang cá nhân"
                        right={isMock && (
                            <Tooltip content="Backend không phản hồi — đang hiển thị dữ liệu mẫu (chỉ ở development)" side="bottom">
                                <span className="inline-flex items-center gap-1 px-2 h-7 rounded-md border border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 font-mono text-[11px]">
                                    <FlaskConical className="w-3 h-3" /> mock
                                </span>
                            </Tooltip>
                        )}
                    />
                </motion.div>

                {overview.loading && !data && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-56 rounded-xl shimmer" />
                        <div className="h-56 rounded-xl shimmer" />
                    </div>
                )}
                {overview.error && (
                    <MacWindow title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> error — zsh</>}>
                        <div className="p-6 text-center font-mono text-[12px]">
                            <p className="text-rose-600 dark:text-rose-400">{overview.error}</p>
                            <Button variant="secondary" size="sm" className="mt-3" onClick={overview.refresh}>Thử lại</Button>
                        </div>
                    </MacWindow>
                )}

                {data && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div variants={card} className="lg:col-span-2">
                                <WhoamiWindow data={data} fallbackName={user?.name || user?.email} streak={streak} streakAtRisk={streakAtRisk} />
                            </motion.div>
                            <motion.div variants={card}>
                                <LaunchpadWindow achievements={data.achievements} />
                            </motion.div>
                        </div>

                        <motion.div variants={card}>
                            <StatsWindow data={data} />
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div variants={card}>
                                <SkillsWindow skills={data.skills} />
                            </motion.div>
                            <motion.div variants={card} className="lg:col-span-2">
                                <ContinueWindow courses={data.continueLearning} />
                            </motion.div>
                        </div>
                    </>
                )}

                <motion.div variants={card}>
                    <MacWindow
                        title={<><GitBranch className="w-3.5 h-3.5 text-fg-muted" /> git log --graph</>}
                        footer={activity.data && (
                            <>
                                <span className="text-fg-2">{activity.data.totalActions.toLocaleString('vi-VN')}</span> hoạt động
                                <span className="text-fg-subtle">·</span>
                                <span className="text-fg-2">{activity.data.activeDays}</span> ngày có học
                                <span className="text-fg-subtle">·</span>
                                chuỗi dài nhất <span className="text-fg-2">{activity.data.longestStreak}</span> ngày
                                <span className="ml-auto">365 ngày</span>
                            </>
                        )}
                    >
                        {activity.loading && !activity.data ? (
                            <div className="p-5"><div className="h-[132px] rounded-lg shimmer" /></div>
                        ) : activity.error ? (
                            <p className="p-6 text-center font-mono text-[12px] text-rose-600 dark:text-rose-400">{activity.error}</p>
                        ) : (
                            <ContributionGraph frameless contributions={contributionData} />
                        )}
                    </MacWindow>
                </motion.div>

                {data && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div variants={card}>
                            <CertificatesWindow certificates={data.certificates} />
                        </motion.div>
                        <motion.div variants={card}>
                            <RecentWindow events={data.recent} />
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   whoami — hồ sơ in ra như file config
   ───────────────────────────────────────────────────────────── */

const Row: React.FC<{ k: string; children: React.ReactNode; className?: string }> = ({ k, children, className }) => (
    <div className={cn('flex gap-3 min-w-0', className)}>
        <span className="w-16 flex-shrink-0 text-fg-subtle select-none">{k}</span>
        <span className="min-w-0 flex-1 text-fg-2 truncate">{children}</span>
    </div>
);

const WhoamiWindow: React.FC<{ data: UserOverview; fallbackName?: string; streak: number; streakAtRisk: boolean }> = ({ data, fallbackName, streak, streakAtRisk }) => {
    const navigate = useNavigate();
    const name = data.profile.fullName || fallbackName || 'Học viên';
    const avatarUrl = data.profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const material = RANK_MATERIAL[data.rank.id];
    const nextId = RANK_ORDER[RANK_ORDER.indexOf(data.rank.id) + 1];
    const rankProgress = data.rank.nextMinPoints
        ? Math.min(100, ((data.points - data.rank.minPoints) / (data.rank.nextMinPoints - data.rank.minPoints)) * 100)
        : 100;

    return (
        <MacWindow
            title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> whoami — zsh</>}
            footer={
                <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> online
                    <span className="text-fg-subtle">·</span>
                    tham gia {new Date(data.joinedAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                    <span className="ml-auto">{data.profile.role ?? 'User'}</span>
                </>
            }
            className="h-full"
        >
            <TermCommand cmd="whoami" flags="--verbose" />
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 flex-shrink-0 rounded-2xl bg-surface-2 ring-1 ring-line shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] dark:shadow-none"
                />
                <div className="flex-1 min-w-0 font-mono text-[12px] leading-[1.9]">
                    <Row k="name"><span className="text-fg font-semibold">{name}</span></Row>
                    <Row k="email">{data.profile.email}</Row>
                    <Row k="rank">
                        <RankBadge id={data.rank.id} className="mr-1.5" />
                        <span className={cn('font-semibold', material.text)}>{data.rank.label.toLowerCase()}</span>
                        <span className="text-fg-subtle"> · </span>
                        <span className="text-fg tabular-nums">{data.points.toLocaleString('vi-VN')}</span> pts
                        {data.rank.nextLabel && data.rank.nextMinPoints != null && nextId && (
                            <span className="text-fg-muted">
                                {' · còn '}{(data.rank.nextMinPoints - data.points).toLocaleString('vi-VN')}{' → '}
                                <RankBadge id={nextId} className="mx-1" />
                                <span className={RANK_MATERIAL[nextId].text}>{data.rank.nextLabel.toLowerCase()}</span>
                            </span>
                        )}
                    </Row>
                    <Row k="">
                        <TermBar percent={rankProgress} width={18} tone={material.bar} />
                        <span className="ml-2 text-fg-muted tabular-nums">{Math.round(rankProgress)}%</span>
                    </Row>
                    <Row k="streak">
                        {streak > 0
                            ? <><span className="text-fg tabular-nums">{streak}</span> ngày 🔥{streakAtRisk && <span className="text-amber-600 dark:text-amber-400"> — học hôm nay để giữ</span>}</>
                            : <span className="text-fg-muted">0 — học một bài hôm nay để bắt đầu</span>}
                    </Row>
                    <Row k="courses">
                        <span className="text-fg tabular-nums">{data.stats.enrolledCourses}</span> đã ghi danh
                        <span className="text-fg-subtle"> · </span>
                        <span className="text-fg tabular-nums">{data.stats.completedCourses}</span> hoàn thành
                    </Row>
                </div>
            </div>
            <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
                    <Settings className="w-3.5 h-3.5" /> Chỉnh sửa
                </Button>
                <Button size="sm" onClick={() => navigate('/my-courses')}>
                    <BookOpen className="w-3.5 h-3.5" /> Khóa của tôi
                </Button>
            </div>
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   Launchpad — thành tích là app icon; chưa đạt thì mờ + khóa + vạch tiến độ
   ───────────────────────────────────────────────────────────── */

const LaunchpadWindow: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
    const earned = achievements.filter((a) => a.earned).length;
    return (
        <MacWindow
            title={<><LayoutGrid className="w-3.5 h-3.5 text-fg-muted" /> Launchpad</>}
            footer={<>{earned}/{achievements.length} đã mở khóa<span className="ml-auto tabular-nums">{Math.round((earned / Math.max(1, achievements.length)) * 100)}%</span></>}
            className="h-full"
        >
            <div className="p-4 sm:p-5 grid grid-cols-5 gap-x-2 gap-y-4 justify-items-center">
                {achievements.map((a) => <AppIcon key={a.id} a={a} />)}
            </div>
        </MacWindow>
    );
};

const AppIcon: React.FC<{ a: Achievement }> = ({ a }) => {
    const Icon = ACHIEVEMENT_ICON[a.id] ?? Star;
    const pct = Math.round((a.progress / a.target) * 100);
    return (
        <Tooltip
            content={
                <span className="block max-w-[180px]">
                    <span className="block font-semibold">{a.label}</span>
                    <span className="block opacity-80">{a.description}</span>
                    {!a.earned && <span className="block mt-0.5 opacity-70 font-mono">{a.progress}/{a.target}</span>}
                </span>
            }
        >
            <button
                aria-label={`${a.label}: ${a.description}${a.earned ? ' (đã đạt)' : ` (${a.progress}/${a.target})`}`}
                className="group relative flex flex-col items-center gap-1.5 outline-none"
            >
                <span
                    className={cn(
                        'relative w-12 h-12 rounded-[26%] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-primary-500/25',
                        a.earned
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_6px_14px_-4px_rgb(217_119_6/0.5)]'
                            : 'bg-surface-2 text-fg-subtle ring-1 ring-line',
                    )}
                >
                    <Icon className="w-5 h-5" strokeWidth={a.earned ? 2.25 : 2} />
                    {!a.earned && (
                        <span className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-surface border border-line flex items-center justify-center text-fg-subtle shadow-sm">
                            <Lock className="w-2.5 h-2.5" />
                        </span>
                    )}
                </span>
                {/* Vạch tiến độ mảnh dưới icon chưa đạt — như app đang tải trên Launchpad */}
                <span className="h-[3px] w-10 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
                    <span className={cn('block h-full rounded-full', a.earned ? 'bg-amber-400' : 'bg-primary-500')} style={{ width: `${a.earned ? 100 : pct}%` }} />
                </span>
            </button>
        </Tooltip>
    );
};

/* ─────────────────────────────────────────────────────────────
   stats — cùng cửa sổ terminal với trang chủ, lệnh --me
   ───────────────────────────────────────────────────────────── */

const StatsWindow: React.FC<{ data: UserOverview }> = ({ data }) => {
    const s = data.stats;
    const tiles: TermStatItem[] = [
        { icon: Clock,    k: 'study_time',   label: 'Thời gian học', value: fmtStudyTime(s.studySeconds) },
        { icon: BookOpen, k: 'lessons_done', label: 'Bài đã học',    value: s.lessonsCompleted },
        { icon: Target,   k: 'quiz_passed',  label: 'Quiz đạt',      value: `${s.quizPassed}/${s.quizAttempts}`, sub: s.quizAttempts ? `${Math.round(s.quizPassRate)}% đạt` : undefined },
        { icon: Award,    k: 'certificates', label: 'Chứng chỉ',     value: s.certificates, sub: s.bestScore ? `cao nhất ${Math.round(s.bestScore)}` : undefined },
    ];
    return (
        <MacWindow
            title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> stats — zsh</>}
            footer={<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live<span className="ml-auto">UTF-8</span></>}
        >
            <TermCommand cmd="eduhub stats" flags="--me" />
            <TermStatGrid items={tiles} />
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   Activity Monitor — kỹ năng là process, cột progress dạng htop
   ───────────────────────────────────────────────────────────── */

const SkillsWindow: React.FC<{ skills: SkillProgress[] }> = ({ skills }) => {
    const sorted = useMemo(() => [...skills].sort((a, b) => b.progress - a.progress), [skills]);
    return (
        <MacWindow
            title={<><Activity className="w-3.5 h-3.5 text-fg-muted" /> Activity Monitor</>}
            footer={<>{skills.length} process<span className="ml-auto">sort: progress ↓</span></>}
            className="h-full"
        >
            <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-4 h-8 border-b border-line bg-surface-2/60 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                <span>process</span>
                <span className="text-right">progress</span>
            </div>
            {sorted.length === 0 ? (
                <p className="p-6 text-center font-mono text-[12px] text-fg-subtle">{'// '}hoàn thành bài học để thấy tiến độ kỹ năng</p>
            ) : (
                <ul className="divide-y divide-line-2">
                    {sorted.map((s) => (
                        <li key={`${s.kind}-${s.id}`} className="grid grid-cols-[1fr_auto] gap-x-3 items-center px-4 h-11 font-mono text-[12px] transition-colors hover:bg-primary-500/[0.05]">
                            <span className="flex items-center gap-2 min-w-0">
                                {s.iconUrl
                                    ? <img src={s.iconUrl} alt="" className="w-5 h-5 rounded-md flex-shrink-0" loading="lazy" />
                                    : <span className="w-5 h-5 rounded-md bg-surface-2 text-[10px] font-bold text-primary-600 dark:text-primary-300 flex items-center justify-center flex-shrink-0">{s.name.charAt(0)}</span>}
                                <span className="truncate text-fg">{s.name}</span>
                                <span className="px-1 rounded bg-surface-2 text-[9px] uppercase tracking-wider text-fg-subtle flex-shrink-0">{s.kind === 'language' ? 'lang' : 'fw'}</span>
                            </span>
                            <span className="flex items-center gap-2 whitespace-nowrap">
                                <TermBar percent={s.progress} width={8} />
                                <span className="w-9 text-right text-fg tabular-nums">{Math.round(s.progress)}%</span>
                                <span className="hidden xl:inline w-12 text-right text-fg-subtle tabular-nums">{s.completedLessons}/{s.totalLessons}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   Editor — mỗi khóa đang dở là một tab đang mở
   ───────────────────────────────────────────────────────────── */

const ContinueWindow: React.FC<{ courses: ContinueCourse[] }> = ({ courses }) => {
    const navigate = useNavigate();
    const [active, setActive] = useState(0);
    const c = courses[Math.min(active, courses.length - 1)];

    return (
        <MacWindow
            title={<><Code2 className="w-3.5 h-3.5 text-fg-muted" /> {c ? c.title : 'Học tiếp'} — eduhub</>}
            footer={c
                ? <>{LEVEL[c.level].label}{c.lastActivityAt && <><span className="text-fg-subtle">·</span>{timeAgo(c.lastActivityAt)}</>}<span className="ml-auto tabular-nums">{Math.round(c.progress)}% hoàn thành</span></>
                : <>0 tab đang mở</>}
            className="h-full flex flex-col"
        >
            {courses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 font-mono text-[12px]">
                    <p className="text-fg-subtle">{'// '}Chưa có khóa nào đang học</p>
                    <Button size="sm" className="mt-3" onClick={() => navigate('/')}>Khám phá khóa học <ArrowRight className="w-3.5 h-3.5" /></Button>
                </div>
            ) : (
                <>
                    <div role="tablist" aria-label="Khóa đang học" className="flex items-stretch h-9 border-b border-line bg-surface-2/40 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {courses.map((course, i) => {
                            const isActive = i === active;
                            return (
                                <button
                                    key={course.courseId}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActive(i)}
                                    className={cn(
                                        'relative flex items-center gap-2 px-3.5 font-mono text-[11px] whitespace-nowrap border-r border-line transition-colors',
                                        isActive ? 'text-fg bg-surface' : 'text-fg-muted hover:text-fg-2 hover:bg-surface/60',
                                    )}
                                >
                                    {isActive && <motion.span layoutId="profile-tab-indicator" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500" />}
                                    <span className="w-2 h-2 rounded-[3px] flex-shrink-0" style={{ background: LEVEL[course.level].dot }} aria-hidden />
                                    <span className="max-w-[10rem] truncate">{course.title}</span>
                                    {isActive && <span className="text-fg-subtle" aria-hidden>×</span>}
                                </button>
                            );
                        })}
                    </div>

                    {c && (
                        <div className="flex-1 p-4 sm:p-5 font-mono text-[12px] leading-[1.9]">
                            <Row k="next">{c.nextLessonTitle ? <span className="text-fg">{c.nextLessonTitle}</span> : <span className="text-fg-muted">bài đầu tiên</span>}</Row>
                            <Row k="lessons"><span className="text-fg tabular-nums">{c.completedLessons}</span><span className="text-fg-subtle">/</span>{c.lessonCount} bài</Row>
                            <Row k="">
                                <TermBar percent={c.progress} width={24} tone="emerald" />
                                <span className="ml-2 text-fg-muted tabular-nums">{Math.round(c.progress)}%</span>
                            </Row>
                            <Button
                                size="sm"
                                className="mt-3"
                                onClick={() => navigate(c.nextLessonId ? `/courses/${c.courseId}/learn/${c.nextLessonId}` : `/courses/${c.courseId}/learn`)}
                            >
                                <Play className="w-3.5 h-3.5 fill-current" /> Tiếp tục học
                            </Button>
                        </div>
                    )}
                </>
            )}
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   Finder ~/certificates — mỗi chứng chỉ là một file .cert
   ───────────────────────────────────────────────────────────── */

const CertificatesWindow: React.FC<{ certificates: MyCertificate[] }> = ({ certificates }) => {
    const navigate = useNavigate();
    return (
        <MacWindow
            title={<><FolderOpen className="w-3.5 h-3.5 text-sky-500" /> certificates</>}
            footer={<>{certificates.length} mục<span className="ml-auto text-fg-subtle">~/certificates</span></>}
            className="h-full"
        >
            <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-x-3 items-center px-4 h-8 border-b border-line bg-surface-2/60 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                <span />
                <span>Tên</span>
                <span className="hidden sm:inline">Ngày</span>
                <span className="text-right">Điểm</span>
            </div>
            {certificates.length === 0 ? (
                <p className="p-6 text-center font-mono text-[12px] text-fg-subtle">{'// '}đạt bài kiểm tra cuối khóa để nhận chứng chỉ đầu tiên</p>
            ) : (
                <ul className="divide-y divide-line-2">
                    {certificates.map((cert) => (
                        <li
                            key={cert.id}
                            onClick={() => navigate(`/certificates/${cert.courseId}`)}
                            className="group grid grid-cols-[2rem_1fr_auto_auto] gap-x-3 items-center px-4 h-14 cursor-pointer transition-colors hover:bg-sky-500/[0.06]"
                        >
                            <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-600 text-white">
                                <Award className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-fg truncate group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                                    {cert.courseTitle}<span className="text-fg-subtle font-normal">.cert</span>
                                </p>
                                <p className="font-mono text-[11px] text-fg-subtle truncate">{cert.certificateCode}</p>
                            </div>
                            <span className="hidden sm:inline font-mono text-[11px] text-fg-muted tabular-nums">{new Date(cert.issuedAt).toLocaleDateString('vi-VN')}</span>
                            <span className="font-mono text-[12px] font-semibold text-fg tabular-nums text-right">{Math.round(cert.scorePercentage)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </MacWindow>
    );
};

/* ─────────────────────────────────────────────────────────────
   git log --oneline — hoạt động gần đây là commit log
   ───────────────────────────────────────────────────────────── */

const RecentWindow: React.FC<{ events: RecentEvent[] }> = ({ events }) => (
    <MacWindow
        title={<><GitCommitHorizontal className="w-3.5 h-3.5 text-fg-muted" /> git log --oneline</>}
        footer={<>{events.length} commit<span className="ml-auto">main</span></>}
        className="h-full"
    >
        <TermCommand cmd="git log" flags={`--oneline -n ${events.length}`} />
        {events.length === 0 ? (
            <p className="p-6 text-center font-mono text-[12px] text-fg-subtle">{'// '}chưa có hoạt động nào — bắt đầu một bài học nhé</p>
        ) : (
            <ol className="divide-y divide-line-2 font-mono text-[12px]">
                {events.map((e, i) => {
                    const m = EVENT_META[e.kind];
                    return (
                        <li key={`${e.kind}-${e.at}-${i}`} className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-primary-500/[0.04]">
                            <span className="w-10 flex-shrink-0 text-amber-600 dark:text-amber-400 tabular-nums">{fmtDate(e.at)}</span>
                            <m.icon className={cn('w-4 h-4 mt-px flex-shrink-0', m.cls)} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate">
                                    <span className="text-fg font-medium">{m.label}</span>
                                    <span className="text-fg-subtle"> · </span>
                                    <span className="text-fg-2">{e.title}</span>
                                    {e.kind === 'quiz' && e.value != null && (
                                        <span className={cn('ml-2 inline-flex items-center gap-0.5 text-[11px] font-semibold', e.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                            {e.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {Math.round(e.value)}%
                                        </span>
                                    )}
                                </span>
                                <span className="block text-[11px] text-fg-subtle truncate">{e.courseTitle} · {timeAgo(e.at)}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        )}
    </MacWindow>
);

export default PersonalPage;
