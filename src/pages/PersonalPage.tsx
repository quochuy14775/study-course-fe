import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Clock, BookOpen, Award, Target, Play, ArrowRight, FlaskConical, Lock, Trophy, Star,
    CheckCircle2, XCircle, GraduationCap, UserPlus, Settings, Calendar, Flame, Code2, BadgeCheck,
    Activity, Rocket, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMyActivity } from '../hooks/useMyActivity';
import { useMyOverview } from '../hooks/useMyOverview';
import { ContributionGraph, type ContributionDay } from '../components/ContributionGraph';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import {
    container, card, pop, EASE, TONES, TiltCard, LiftCard, CardHeading, StatTile, Sparkles, AnimatedNumber,
    ProfileBackdrop, ProfileTitle, fmtStudyTime, timeAgo,
} from '../components/profile/ProfileKit';
import AdminProfilePage from './AdminProfilePage';
import { cn } from '../lib/cn';
import type { Achievement, RankId, RecentEvent } from '../types/userOverview';

/* ─────────────────────────────────────────────────────────────
   Bảng tra
   ───────────────────────────────────────────────────────────── */

const RANK_STYLE: Record<RankId, { chip: string }> = {
    bronze:   { chip: 'from-amber-700 to-orange-600' },
    silver:   { chip: 'from-slate-400 to-slate-500' },
    gold:     { chip: 'from-amber-400 to-yellow-500' },
    platinum: { chip: 'from-sky-400 to-cyan-500' },
    diamond:  { chip: 'from-violet-500 to-fuchsia-500' },
};

const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
    'first-lesson': BookOpen, 'lessons-25': BookOpen, 'lessons-100': BookOpen,
    'streak-7': Flame, 'streak-30': Flame,
    'quiz-10': Target, 'perfect-score': Star,
    'first-cert': Award, 'certs-5': Award,
    'active-100': Calendar,
};

const EVENT_META: Record<RecentEvent['kind'], { icon: LucideIcon; label: string; cls: string }> = {
    lesson: { icon: CheckCircle2,  label: 'Hoàn thành bài', cls: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' },
    quiz:   { icon: Target,        label: 'Làm quiz',       cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
    cert:   { icon: Award,         label: 'Chứng chỉ',      cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    enroll: { icon: UserPlus,      label: 'Ghi danh',       cls: 'bg-surface-2 text-fg-muted' },
};

const LEVEL_LABEL = { Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao' } as const;

/* ─────────────────────────────────────────────────────────────
   Page — admin không học nên có trang riêng
   ───────────────────────────────────────────────────────────── */

const PersonalPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    if (user?.role === 'Admin') return <AdminProfilePage />;
    return <LearnerProfile />;
};

const LearnerProfile: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const overview = useMyOverview();
    const activity = useMyActivity(365);

    const data = overview.data;
    const displayName = data?.profile.fullName || user?.name || user?.email || 'Học viên';
    const displayEmail = data?.profile.email || user?.email || '';
    const avatarUrl = data?.profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

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

    const rankStyle = data ? RANK_STYLE[data.rank.id] : RANK_STYLE.bronze;
    const rankProgress = data && data.rank.nextMinPoints
        ? Math.min(100, ((data.points - data.rank.minPoints) / (data.rank.nextMinPoints - data.rank.minPoints)) * 100)
        : 100;
    const earned = data?.achievements.filter((a) => a.earned).length ?? 0;

    return (
        <main className="min-h-screen relative overflow-hidden">
            <ProfileBackdrop />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6"
            >
                <ProfileTitle
                    path={['personal']}
                    title="Trang cá nhân"
                    right={isMock && (
                        <Tooltip content="Backend không phản hồi — đang hiển thị dữ liệu mẫu (chỉ ở development)" side="bottom">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-[11px] font-semibold">
                                <FlaskConical className="w-3 h-3" /> Dữ liệu mẫu
                            </span>
                        </Tooltip>
                    )}
                />

                {overview.loading && !data && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-40 rounded-2xl shimmer" />
                        <div className="h-40 rounded-2xl shimmer" />
                    </div>
                )}
                {overview.error && (
                    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
                        <p className="text-sm text-fg-2">{overview.error}</p>
                        <Button variant="secondary" size="sm" className="mt-3" onClick={overview.refresh}>Thử lại</Button>
                    </div>
                )}

                {data && (
                    <>
                        {/* ── Hồ sơ + Thành tích ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <TiltCard className="lg:col-span-2 p-5 sm:p-6 overflow-hidden">
                                {/* shimmer sweep */}
                                <motion.div
                                    className="pointer-events-none absolute top-0 -left-1/3 w-1/3 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"
                                    animate={{ left: ['-40%', '140%'] }}
                                    transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
                                />
                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                                    <div className="relative flex-shrink-0">
                                        <motion.img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-2 ring-4 ring-surface shadow-soft-lg"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                                            whileHover={{ scale: 1.08, rotate: 3 }}
                                        />
                                        <span className={cn('absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r shadow-md', rankStyle.chip)}>
                                            {data.rank.label}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h2 className="text-xl font-bold text-fg truncate">{displayName}</h2>
                                            {data.profile.role && <Badge variant="primary" size="sm">{data.profile.role}</Badge>}
                                            <motion.span
                                                className="relative px-2.5 py-1 bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 text-[11px] font-bold rounded-full border border-orange-100 dark:border-orange-500/30 flex items-center gap-1"
                                                animate={streak > 0 ? { boxShadow: ['0 0 0 0 rgb(251 146 60 / 0.5)', '0 0 0 8px rgb(251 146 60 / 0)'] } : undefined}
                                                transition={{ duration: 2, ease: 'easeOut', repeat: Infinity }}
                                            >
                                                {streak > 0 && <Sparkles />}
                                                <Zap className="w-3 h-3 fill-current" />
                                                {streak} NGÀY
                                            </motion.span>
                                        </div>
                                        <p className="text-sm text-fg-muted mt-0.5 truncate">{displayEmail}</p>
                                        <p className="text-xs text-fg-subtle mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Tham gia {new Date(data.joinedAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
                                            <span className="inline-flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {data.stats.enrolledCourses} khóa · {data.stats.completedCourses} hoàn thành</span>
                                            {streakAtRisk && <span className="text-amber-600 dark:text-amber-400 font-medium">Học hôm nay để giữ streak</span>}
                                        </p>

                                        {/* Hạng & điểm */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                <span className="text-fg-muted">
                                                    <span className="font-bold text-fg"><AnimatedNumber value={data.points} /></span> điểm
                                                    {data.rank.nextLabel && data.rank.nextMinPoints != null && (
                                                        <> · còn <span className="font-semibold text-fg-2">{(data.rank.nextMinPoints - data.points).toLocaleString('vi-VN')}</span> để lên {data.rank.nextLabel}</>
                                                    )}
                                                </span>
                                                <span className="font-semibold text-fg-2 tabular-nums">{Math.round(rankProgress)}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                                                <motion.div
                                                    className={cn('h-full rounded-full bg-gradient-to-r', rankStyle.chip)}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${rankProgress}%` }}
                                                    transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                        <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
                                            <Settings className="w-3.5 h-3.5" /> Chỉnh sửa
                                        </Button>
                                        <Button size="sm" onClick={() => navigate('/my-courses')}>
                                            <BookOpen className="w-3.5 h-3.5" /> Khóa của tôi
                                        </Button>
                                    </div>
                                </div>
                            </TiltCard>

                            {/* Thành tích — tone hổ phách (huy chương); nhấc nhẹ, không nghiêng để badge không bị phóng to */}
                            <LiftCard tone="amber" watermark={Trophy} className="p-5 sm:p-6">
                                <CardHeading
                                    tone="amber"
                                    icon={Trophy}
                                    title="Thành tích"
                                    subtitle={`${earned}/${data.achievements.length} đã mở khóa`}
                                    right={
                                        <span className={cn('px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums', TONES.amber.soft)}>
                                            {Math.round((earned / Math.max(1, data.achievements.length)) * 100)}%
                                        </span>
                                    }
                                    className="mb-5"
                                />
                                <motion.div className="grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
                                    {data.achievements.map((a) => <AchievementBadge key={a.id} a={a} />)}
                                </motion.div>
                            </LiftCard>
                        </div>

                        {/* ── Thống kê · Kỹ năng · Học tiếp ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Mỗi ô một tone trùng với card liên quan: học tiếp / kỹ năng / thành tích / chứng chỉ */}
                            <motion.div variants={card} className="grid grid-cols-2 gap-3 content-start">
                                <StatTile tone="emerald" icon={Clock}    label="Thời gian học"  value={fmtStudyTime(data.stats.studySeconds)} />
                                <StatTile tone="primary" icon={BookOpen} label="Bài đã học"     value={data.stats.lessonsCompleted} />
                                <StatTile tone="amber"   icon={Target}   label="Quiz đạt"       value={`${data.stats.quizPassed}/${data.stats.quizAttempts}`} sub={data.stats.quizAttempts ? `${Math.round(data.stats.quizPassRate)}%` : undefined} />
                                <StatTile tone="sky"     icon={Award}    label="Chứng chỉ"      value={data.stats.certificates} sub={data.stats.bestScore ? `cao nhất ${Math.round(data.stats.bestScore)}` : undefined} />
                            </motion.div>

                            {/* Kỹ năng — tone tím brand (code) */}
                            <LiftCard tone="primary" watermark={Code2} className="p-6">
                                <CardHeading tone="primary" icon={Code2} title="Kỹ năng" subtitle="% bài học hoàn thành theo ngôn ngữ / framework" className="mb-5" />
                                {data.skills.length === 0 ? (
                                    <p className="text-sm text-fg-subtle py-6 text-center">Hoàn thành bài học để thấy tiến độ kỹ năng.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {data.skills.map((skill, idx) => (
                                            <div key={`${skill.kind}-${skill.id}`} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-2 font-medium text-fg-2">
                                                        {skill.iconUrl
                                                            ? <img src={skill.iconUrl} alt="" className="w-5 h-5 rounded-md" loading="lazy" />
                                                            : <span className={cn('w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center', TONES.primary.soft)}>{skill.name.charAt(0)}</span>}
                                                        {skill.name}
                                                        <span className="px-1.5 py-px rounded-md bg-surface-2 text-[9px] uppercase tracking-wider text-fg-subtle font-semibold">{skill.kind === 'language' ? 'ngôn ngữ' : 'framework'}</span>
                                                    </span>
                                                    <span className="text-fg-subtle tabular-nums">{skill.completedLessons}/{skill.totalLessons} · <span className="font-semibold text-fg-2">{Math.round(skill.progress)}%</span></span>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${skill.progress}%` }}
                                                        viewport={{ once: true, margin: '-40px' }}
                                                        transition={{ duration: 1, ease: EASE, delay: idx * 0.1 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </LiftCard>

                            {/* Học tiếp — tone xanh ngọc (tiến độ / play) */}
                            <LiftCard tone="emerald" watermark={Rocket} className="md:col-span-2 lg:col-span-1 p-6 flex flex-col">
                                <CardHeading tone="emerald" icon={Rocket} title="Học tiếp" subtitle="Khóa đang dở, mới học gần đây nhất ở trên" className="mb-4" />
                                {data.continueLearning.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                        <p className="text-sm text-fg-2">Chưa có khóa nào đang học.</p>
                                        <Button size="sm" className="mt-3" onClick={() => navigate('/')}>Khám phá khóa học <ArrowRight className="w-3.5 h-3.5" /></Button>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {data.continueLearning.map((c) => (
                                            <li key={c.courseId} className="group/item rounded-xl border border-line-2 p-3 transition-colors hover:border-emerald-300/70 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-fg truncate">{c.title}</p>
                                                        <p className="text-[11px] text-fg-subtle mt-0.5 truncate">
                                                            {LEVEL_LABEL[c.level]} · {c.completedLessons}/{c.lessonCount} bài
                                                            {c.lastActivityAt && ` · ${timeAgo(c.lastActivityAt)}`}
                                                        </p>
                                                    </div>
                                                    <span className={cn('text-sm font-bold tabular-nums flex-shrink-0', TONES.emerald.text)}>{Math.round(c.progress)}%</span>
                                                </div>
                                                <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                                                    <motion.div
                                                        className={cn('h-full rounded-full bg-gradient-to-r', TONES.emerald.bar)}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${c.progress}%` }}
                                                        transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => navigate(c.nextLessonId ? `/courses/${c.courseId}/learn/${c.nextLessonId}` : `/courses/${c.courseId}/learn`)}
                                                    className={cn('mt-2.5 w-full flex items-center gap-2 text-xs font-semibold', TONES.emerald.text)}
                                                >
                                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgb(16_185_129/0.45)] group-hover/item:scale-110 transition-transform">
                                                        <Play className="w-3 h-3 fill-current ml-0.5" />
                                                    </span>
                                                    <span className="truncate">{c.nextLessonTitle ? `Tiếp: ${c.nextLessonTitle}` : 'Tiếp tục học'}</span>
                                                    <ArrowRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 transition-transform group-hover/item:translate-x-0.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </LiftCard>
                        </div>
                    </>
                )}

                {/* ── Contribution graph ── */}
                <motion.section variants={card} whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
                    {activity.loading && !activity.data ? (
                        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
                            <div className="h-4 w-56 rounded shimmer mb-5" />
                            <div className="h-[132px] rounded-lg shimmer" />
                        </div>
                    ) : activity.error ? (
                        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card text-sm text-fg-muted text-center">{activity.error}</div>
                    ) : (
                        <ContributionGraph
                            contributions={contributionData}
                            subtitle={activity.data && (
                                <>
                                    <span className="font-semibold text-fg-2">{activity.data.totalActions.toLocaleString('vi-VN')}</span> hoạt động
                                    <span className="mx-1.5 text-fg-subtle">·</span>
                                    <span className="font-semibold text-fg-2">{activity.data.activeDays}</span> ngày có học
                                    <span className="mx-1.5 text-fg-subtle">·</span>
                                    chuỗi dài nhất <span className="font-semibold text-fg-2">{activity.data.longestStreak}</span> ngày
                                </>
                            )}
                        />
                    )}
                </motion.section>

                {/* ── Chứng chỉ · Hoạt động gần đây ── */}
                {data && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chứng chỉ — tone xanh da trời (xác thực) */}
                        <LiftCard tone="sky" watermark={BadgeCheck} className="p-6">
                            <CardHeading
                                tone="sky"
                                icon={BadgeCheck}
                                title="Chứng chỉ của tôi"
                                subtitle="Cấp khi đạt bài kiểm tra cuối khóa · có mã xác thực"
                                right={<span className={cn('px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums', TONES.sky.soft)}>{data.stats.certificates}</span>}
                                className="mb-4"
                            />
                            {data.certificates.length === 0 ? (
                                <p className="text-sm text-fg-subtle py-6 text-center">Đạt bài kiểm tra cuối khóa để nhận chứng chỉ đầu tiên.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {data.certificates.map((c) => (
                                        <motion.li
                                            key={c.id}
                                            variants={pop}
                                            whileHover={{ x: 3 }}
                                            onClick={() => navigate(`/certificates/${c.courseId}`)}
                                            className="flex items-center gap-3 rounded-xl border border-line-2 p-3 cursor-pointer transition-colors hover:border-sky-300/70 hover:bg-sky-50/40 dark:hover:bg-sky-500/5"
                                        >
                                            <span className={cn('w-10 h-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center flex-shrink-0', TONES.sky.tile)}>
                                                <Award className="w-5 h-5" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-fg truncate">{c.courseTitle}</p>
                                                <p className="text-[11px] text-fg-subtle font-mono truncate">{c.certificateCode} · {new Date(c.issuedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <span className={cn('px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums flex-shrink-0', TONES.sky.soft)}>{Math.round(c.scorePercentage)} điểm</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </LiftCard>

                        {/* Hoạt động — tone hồng (nhịp hoạt động) */}
                        <LiftCard tone="rose" watermark={Activity} className="p-6">
                            <CardHeading tone="rose" icon={Activity} title="Hoạt động gần đây" subtitle="Bài học, quiz, chứng chỉ, ghi danh — mới nhất ở trên" className="mb-4" />
                            {data.recent.length === 0 ? (
                                <p className="text-sm text-fg-subtle py-6 text-center">Chưa có hoạt động nào. Bắt đầu một bài học nhé!</p>
                            ) : (
                                <ol>
                                    {data.recent.map((e, i) => {
                                        const m = EVENT_META[e.kind];
                                        const last = i === data.recent.length - 1;
                                        return (
                                            <motion.li
                                                key={`${e.kind}-${e.at}-${i}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.05 }}
                                                className="relative flex gap-3 pb-3.5 last:pb-0"
                                            >
                                                {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" aria-hidden />}
                                                <span className={cn('relative z-10 w-8 h-8 rounded-full border border-line flex items-center justify-center flex-shrink-0', m.cls)}>
                                                    <m.icon className="w-3.5 h-3.5" />
                                                </span>
                                                <div className="min-w-0 flex-1 pt-1">
                                                    <p className="text-sm text-fg-2 leading-snug">
                                                        <span className="font-semibold text-fg">{m.label}</span> · {e.title}
                                                        {e.kind === 'quiz' && e.value != null && (
                                                            <span className={cn('ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold', e.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                                                {e.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {Math.round(e.value)}%
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[11px] text-fg-subtle mt-0.5 truncate">{e.courseTitle} · {timeAgo(e.at)}</p>
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </ol>
                            )}
                        </LiftCard>
                    </div>
                )}
            </motion.div>
        </main>
    );
};

/* ─────────────────────────────────────────────────────────────
   Huy hiệu thành tích — tròn, đã đạt = huy chương vàng, chưa đạt = vòng tiến độ
   ───────────────────────────────────────────────────────────── */

const AchievementBadge: React.FC<{ a: Achievement }> = ({ a }) => {
    const Icon = ACHIEVEMENT_ICON[a.id] ?? Star;
    return (
        <Tooltip
            content={
                <span className="block max-w-[180px]">
                    <span className="block font-semibold">{a.label}</span>
                    <span className="block opacity-80">{a.description}</span>
                    {!a.earned && <span className="block mt-0.5 opacity-70">{a.progress}/{a.target}</span>}
                </span>
            }
        >
            <motion.button
                variants={pop}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                aria-label={`${a.label}: ${a.description}${a.earned ? ' (đã đạt)' : ` (${a.progress}/${a.target})`}`}
                className="relative w-12 h-12 rounded-full flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25"
            >
                <span
                    className={cn('absolute inset-0 rounded-full', a.earned && 'bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-500/50 dark:to-orange-500/50')}
                    style={a.earned ? undefined : {
                        background: `conic-gradient(rgb(245 158 11) ${Math.round((a.progress / a.target) * 100)}%, rgb(var(--surface-3)) 0)`,
                    }}
                />
                <span
                    className={cn(
                        'absolute inset-[3px] rounded-full flex items-center justify-center',
                        a.earned
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_14px_-4px_rgb(217_119_6/0.6)]'
                            : 'bg-surface text-fg-subtle',
                    )}
                >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={a.earned ? 2.25 : 2} />
                </span>
                {!a.earned && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-surface border border-line flex items-center justify-center text-fg-subtle shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                    </span>
                )}
            </motion.button>
        </Tooltip>
    );
};

export default PersonalPage;
